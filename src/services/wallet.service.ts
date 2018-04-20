import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CryptoTransaction, CryptoTransactionData, CryptoTransactionOutput } from 'rogerthat-plugin';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { map, mergeMap, retryWhen, timeout } from 'rxjs/operators';
import { TimeoutError } from 'rxjs/util/TimeoutError';
import { configuration } from '../configuration';
import {
  COIN_TO_HASTINGS,
  CoinInput,
  CreateSignatureData,
  CreateTransaction,
  CreateTransactionResult,
  ExplorerBlock,
  ExplorerBlockGET,
  ExplorerHashGET,
  PendingTransaction,
  TransactionPool,
  TranslatedError,
} from '../interfaces';
import { convertPendingTransaction, convertTransaction, filterTransactionsByAddress, getInputIds, isUnrecognizedHashError } from '../util';

@Injectable()
export class WalletService {
  unavailableExplorers: string[] = [];

  constructor(private http: HttpClient) {
    const resetDelay = 5 * 60 * 1000;
    TimerObservable.create(resetDelay, resetDelay).subscribe(a => {
      this.unavailableExplorers = [];
    });
  }

  getLatestBlock() {
    return this._get<ExplorerBlock>('/explorer');
  }

  getBlock(height: number) {
    return this._get<ExplorerBlockGET>(`/explorer/blocks/${height}`);
  }

  getTransactions(address: string) {
    return this.getHashInfo(address).pipe(map(info => info.transactions.map(t => convertTransaction(t, address))
      .sort((t1, t2) => t2.height - t1.height)));
  }

  getHashInfo(hash: string) {
    return this._get<ExplorerHashGET>(`/explorer/hashes/${hash}`);
  }

  getTransactionPool() {
    return this._get<TransactionPool>('/transactionpool/transactions');
  }

  getPendingTransactions(address: string, outputIds: string[]): Observable<PendingTransaction[]> {
    return this.getTransactionPool().pipe(
      map(pool => filterTransactionsByAddress(address, pool.transactions || [])
        .map(t => convertPendingTransaction(t, address, outputIds))),
    );
  }

  createSignatureData(data: CreateSignatureData, pendingTransactions: PendingTransaction[]): Observable<CryptoTransaction> {
    return this.getHashInfo(data.from_address).pipe(map(hashInfo => {
      const minerfees = (COIN_TO_HASTINGS / 10);
      let inputIds = getInputIds(hashInfo.transactions, data.from_address).available;
      const pendingOutputIds = pendingTransactions
        .map(t => <CoinInput[]>(t.data.coininputs || []))
        .reduce((total: string[], inputs) => [...total, ...inputs.map(input => input.parentid)], []);
      inputIds = inputIds.filter(o => pendingOutputIds.indexOf(o.id) === -1);
      const transactionData: CryptoTransactionData[] = [];
      const required = data.amount * COIN_TO_HASTINGS / Math.pow(10, data.precision);
      const requiredFunds = required + minerfees;
      const totalFunds = inputIds.reduce((total, output) => total + parseInt(output.amount), 0);
      if (requiredFunds > totalFunds) {
        throw new TranslatedError('insufficient_funds');
      }
      let inputValue = 0;
      for (const inputId of inputIds) {
        const d: CryptoTransactionData = {
          timelock: 0,
          outputs: [],
          algorithm: 'ed25519',
          public_key: '',
          public_key_index: 0,
          signature: '',
          signature_hash: '',
          input: {
            parent_id: inputId.id,
            timelock: 0,
          },
        };
        transactionData.push(d);
        inputValue += parseInt(inputId.amount);
        if (inputValue >= requiredFunds) {
          // done
          break;
        }
      }
      transactionData[0].outputs.push({ value: required.toString(), unlockhash: data.to_address });
      // Send the rest (if any) to our address
      const difference = inputValue - requiredFunds;
      if (difference > 0) {
        transactionData[0].outputs.push({ value: difference.toString(), unlockhash: data.from_address });
      }
      return <CryptoTransaction>{
        minerfees: minerfees.toString(),
        from_address: data.from_address,
        to_address: data.to_address,
        data: transactionData,
      };
    }));
  }

  // TODO update to version 1. App needs to be updated for that.
  createTransaction(data: CryptoTransaction) {
    const transaction: CreateTransaction = {
      version: 0,
      data: {
        arbitrarydata: null,
        blockstakeinputs: null,
        blockstakeoutputs: null,
        coininputs: data.data.map(d => ({
          parentid: d.input.parent_id,
          unlocker: {
            type: 1,
            condition: {
              publickey: `${d.algorithm}:${d.public_key}`,
            },
            fulfillment: {
              signature: d.signature,
            },
          },
        })),
        coinoutputs: data.data.reduce((total: CryptoTransactionOutput[], d) => ([...total, ...d.outputs]), []),
        minerfees: [data.minerfees],
      },
    };
    return this._post<CreateTransactionResult>(`/transactionpool/transactions`, transaction);
  }

  private _get<T>(path: string, options?: { headers?: HttpHeaders | { [header: string]: string | string[] } }) {
    let currentUrl: string;
    let retries = 0;
    return TimerObservable.create(0).pipe(
      mergeMap(() => {
        currentUrl = this._getUrl();
        return this.http.get<T>(`${currentUrl}${path}`, options);
      }),
      timeout(5000),
      retryWhen(attempts => {
        return attempts.pipe(mergeMap(error => {
          if (error instanceof HttpErrorResponse && typeof error.error === 'object'
            && isUnrecognizedHashError(error.error.message)) {
            // Don't retry in case the hash wasn't recognized
            return ErrorObservable.create(error);
          }
          retries++;
          const shouldRetry = (error instanceof HttpErrorResponse && error.status >= 500 || error.status === 0)
            || error instanceof TimeoutError;
          if (retries < 5 && shouldRetry) {
            this.unavailableExplorers.push(currentUrl);
            return TimerObservable.create(0);
          }
          return ErrorObservable.create(error);
        }));
      }),
    );
  }

  private _post<T>(path: string, body: any | null, options?: { headers?: HttpHeaders | { [header: string]: string | string[] } }) {
    let currentUrl: string;
    let retries = 0;
    return TimerObservable.create(0).pipe(
      mergeMap(() => {
        currentUrl = this._getUrl();
        return this.http.post<T>(currentUrl + path, body, options);
      }),
      timeout(5000),
      retryWhen(attempts => {
        return attempts.pipe(mergeMap(error => {
          retries++;
          const shouldRetry = (error instanceof HttpErrorResponse && error.status >= 500 || error.status === 0)
            || error instanceof TimeoutError;
          if (retries < 5 && shouldRetry) {
            this.unavailableExplorers.push(currentUrl);
            return TimerObservable.create(0);
          }
          return ErrorObservable.create(error);
        }));
      }),
    );
  }

  private _getUrl() {
    // Reset unavailable explorers when all of them are unavailable
    if (this.unavailableExplorers.length === configuration.explorer_urls.length) {
      this.unavailableExplorers = [];
    }
    const urls = configuration.explorer_urls.filter(url => this.unavailableExplorers.indexOf(url) === -1);
    return urls[Math.floor(Math.random() * urls.length)];
  }
}

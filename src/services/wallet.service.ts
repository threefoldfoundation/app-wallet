import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CryptoTransaction, CryptoTransactionData } from 'rogerthat-plugin';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { map, mergeMap, retryWhen, timeout } from 'rxjs/operators';
import { TimeoutError } from 'rxjs/util/TimeoutError';
import { configuration } from '../configuration';
import {
  COIN_TO_HASTINGS,
  CreateSignatureData,
  ParsedTransaction,
  RivineBlock,
  RivineBlockInternal,
  RivineCreateTransaction,
  RivineCreateTransactionResult,
  RivineHashInfo,
  RivineTransaction,
  TranslatedError,
} from '../interfaces';
import { getTransactionAmount, isUnrecognizedHashError } from '../util/wallet';

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
    return this._get<RivineBlockInternal>('/explorer');
  }

  getBlock(height: number) {
    return this._get<RivineBlock>(`/explorer/blocks/${height}`);
  }

  getTransactions(address: string) {
    return this.getHashInfo(address).pipe(map(info => info.transactions.map(t => this._convertTransaction(t, address))
      .sort((t1, t2) => t2.height - t1.height)));
  }

  getHashInfo(hash: string) {
    return this._get<RivineHashInfo>(`/explorer/hashes/${hash}`);
  }

  createSignatureData(data: CreateSignatureData): Observable<CryptoTransaction> {
    return this.getHashInfo(data.from_address).pipe(map(hashInfo => {
      const minerfees = (COIN_TO_HASTINGS / 10);
      const outputIds = this._getOutputIds(hashInfo.transactions, data.from_address);
      const transactionData: CryptoTransactionData[] = [];
      let feeSubtracted = false;
      let hasSufficientFunds = false;
      let amountLeft = data.amount * COIN_TO_HASTINGS / Math.pow(10, data.precision);
      for (const outputId of outputIds) {
        const d: CryptoTransactionData = {
          timelock: 0,
          outputs: [],
          algorithm: 'ed25519',
          public_key: '',
          public_key_index: 0,
          signature: '',
          signature_hash: '',
          input: {
            parent_id: outputId.id,
            timelock: 0,
          },
        };
        let amount = parseInt(outputId.amount);
        if (!feeSubtracted) {
          amount -= minerfees;
          feeSubtracted = true;
        }
        transactionData.push(d);
        if ((amountLeft - amount) > 0) {
          d.outputs.push({value: amount.toString(), unlockhash: data.to_address});
          amountLeft -= amount;
        } else {
          d.outputs.push({value: amountLeft.toString(), unlockhash: data.to_address});
          const restAmount = amount - amountLeft;
          if (restAmount > 0) {
            d.outputs.push({value: restAmount.toString(), unlockhash: data.from_address});
          }
          hasSufficientFunds = true;
          break;
        }
      }
      if (!hasSufficientFunds) {
        throw new TranslatedError('insufficient_funds');
      }
      return <CryptoTransaction>{
        minerfees: minerfees.toString(),
        from_address: data.from_address,
        to_address: data.to_address,
        data: transactionData,
      };
    }));
  }

  createTransaction(data: CryptoTransaction) {
    const transaction: RivineCreateTransaction = {
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
        coinoutputs: data.data.reduce((total, d) => ([...total, ...d.outputs]), []),
        minerfees: [data.minerfees],
      },
    };
    return this._post<RivineCreateTransactionResult>(`/transactionpool/transactions`, transaction);
  }

  private _getOutputIds(transactions: RivineTransaction[], unlockhash: string) {
    const allCoinOutputs: { id: string, amount: string }[] = [];
    const spentOutputs: { output_id: string, amount: string }[] = [];
    for (const t of transactions) {
      const coinOutputIds: string[] = t.coinoutputids || [];
      const coinOutputs = t.rawtransaction.data.coinoutputs || [];
      for (let i = 0; i < coinOutputIds.length; i++) {
        const outputId = coinOutputIds[i];
        const coinOutput = coinOutputs[i];
        if (coinOutput.unlockhash === unlockhash) {
          allCoinOutputs.push({id: outputId, amount: coinOutput.value});
          for (const transaction of transactions) {
            for (const input of transaction.rawtransaction.data.coininputs || []) {
              if (input.parentid === outputId) {
                spentOutputs.push({output_id: outputId, amount: coinOutput.value});
              }
            }
          }
        }
      }
    }
    return allCoinOutputs.filter(output => !spentOutputs.some(o => o.output_id === output.id));
  }

  private _convertTransaction(transaction: RivineTransaction, address: string): ParsedTransaction {
    transaction.coininputoutputs = transaction.coininputoutputs || [];
    transaction.rawtransaction.data.coinoutputs = transaction.rawtransaction.data.coinoutputs || [];
    const amount = getTransactionAmount(address, transaction.coininputoutputs, transaction.rawtransaction.data.coinoutputs);
    return {
      id: transaction.id,
      inputs: transaction.coininputoutputs,
      outputs: transaction.rawtransaction.data.coinoutputs,
      height: transaction.height,
      receiving: amount > 0,
      amount,
      minerfee: (transaction.rawtransaction.data.minerfees || []).reduce((total: number, fee: string) => total + parseInt(fee), 0),
    };
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
          error.error = {'message': 'unrecognized hash used as input to /explorer/has'};
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

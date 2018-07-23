import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { CryptoTransaction, CryptoTransactionData, CryptoTransactionOutput } from 'rogerthat-plugin';
import { Observable, of, throwError, TimeoutError, timer } from 'rxjs';
import { map, mergeMap, retryWhen, switchMap, timeout } from 'rxjs/operators';
import { Provider } from '../configuration';
import {
  BlockFacts,
  COIN_TO_HASTINGS,
  CoinInput,
  CreateSignatureData,
  CreateTransaction,
  CreateTransactionResult,
  ExplorerBlock,
  ExplorerBlockGET,
  ExplorerHashGET,
  ParsedTransaction,
  PendingTransaction,
  TransactionPool,
  TranslatedError,
} from '../interfaces';
import { getKeyPairProvider, IAppState } from '../state';
import {
  convertPendingTransaction,
  convertToV1RawTransaction,
  convertToV1Transaction,
  convertTransaction,
  filterNull,
  filterTransactionsByAddress,
  getInputIds,
  isUnrecognizedHashError,
} from '../util';

@Injectable()
export class WalletService {
  unavailableExplorers: string[] = [];

  constructor(private http: HttpClient,
              private store: Store<IAppState>) {
    const resetDelay = 5 * 60 * 1000;
    timer(resetDelay, resetDelay).subscribe(() => {
      this.unavailableExplorers = [];
    });
  }

  getLatestBlock(): Observable<ExplorerBlockGET> {
    return this._get<BlockFacts>('/explorer').pipe(switchMap(blockFacts => this.getBlock(blockFacts.height)));
  }

  getBlock(height: number) {
    return this._get<ExplorerBlockGET>(`/explorer/blocks/${height}`);
  }

  getTransactions(address: string, hashInfo: ExplorerHashGET | null, latestBlock: ExplorerBlock): Observable<ParsedTransaction[]> {
    if (!hashInfo) {
      return of([]);
    }
    return of(hashInfo).pipe(map(info => {
      const inputs = getInputIds(info.transactions, address, latestBlock).all;
      return info.transactions
        .filter(t => t.rawtransaction.version <= 1)
        .map(t => convertToV1Transaction(t))
        .map(t => convertTransaction(t, address, latestBlock, inputs))
        .sort((t1, t2) => t2.height - t1.height);
    }));
  }

  getHashInfo(hash: string) {
    return this._get<ExplorerHashGET>(`/explorer/hashes/${hash}`);
  }

  getTransactionPool() {
    return this._get<TransactionPool>('/transactionpool/transactions');
  }

  /**
   * Get all transactions that are currently in the pool for a specific address
   */
  getPendingTransactions(address: string, hashInfo: ExplorerHashGET | null, latestBlock: ExplorerBlock): Observable<PendingTransaction[]> {
    return this.getTransactionPool().pipe(
      map(pool => {
        const inputs = hashInfo ? getInputIds(hashInfo.transactions, address, latestBlock).all : [];
        return (pool.transactions || []).filter(t => filterTransactionsByAddress(address, t) && t.version <= 1)
          .map(t => convertToV1RawTransaction(t))
          .map(t => convertPendingTransaction(t, address, latestBlock, inputs));
      }));
  }

  createSignatureData(data: CreateSignatureData, pendingTransactions: PendingTransaction[],
                      latestBlock: ExplorerBlock): Observable<CryptoTransaction> {
    return this.getHashInfo(data.from_address).pipe(map(hashInfo => {
      const minerfees = (COIN_TO_HASTINGS / 10);
      let inputIds = getInputIds(hashInfo.transactions, data.from_address, latestBlock).available;
      const pendingOutputIds = pendingTransactions
        .map(t => <CoinInput[]>(t.data.coininputs || []))
        .reduce((total: string[], inputs) => [ ...total, ...inputs.map(input => input.parentid) ], []);
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
      transactionData[ 0 ].outputs.push({ value: required.toString(), unlockhash: data.to_address });
      // Send the rest (if any) to our address
      const difference = inputValue - requiredFunds;
      if (difference > 0) {
        transactionData[ 0 ].outputs.push({ value: difference.toString(), unlockhash: data.from_address });
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
        coinoutputs: data.data.reduce((total: CryptoTransactionOutput[], d) => ([ ...total, ...d.outputs ]), []),
        minerfees: [ data.minerfees ],
      },
    };
    return this._post<CreateTransactionResult>(`/transactionpool/transactions`, transaction);
  }

  /**
   * Executes a GET request to one of the available explorers.
   * Should the request fail, it is retried 4 more times to different explorers.
   */
  private _get<T>(path: string, options?: { headers?: HttpHeaders | { [ header: string ]: string | string[] } }) {
    let currentUrl: string;
    let retries = 0;
    return this.store.pipe(select(getKeyPairProvider), filterNull()).pipe(
      switchMap(provider => {
        currentUrl = this._getUrl(provider);
        return this.http.get<T>(`${currentUrl}${path}`, options).pipe(
          timeout(5000),
          retryWhen(attempts => {
            return attempts.pipe(mergeMap(error => {
              if (error instanceof HttpErrorResponse && typeof error.error === 'object'
                && isUnrecognizedHashError(error.error.message)) {
                // Don't retry in case the hash wasn't recognized
                return throwError(error);
              }
              retries++;
              const shouldRetry = (error instanceof HttpErrorResponse && error.status >= 500 || error.status === 0)
                || error instanceof TimeoutError;
              if (retries < 5 && shouldRetry) {
                this.unavailableExplorers.push(currentUrl);
                return timer(0);
              }
              return throwError(error);
            }));
          })
        );
      }),
    );
  }

  private _post<T>(path: string, body: any | null, options?: { headers?: HttpHeaders | { [ header: string ]: string | string[] } }) {
    let currentUrl: string;
    let retries = 0;
    return this.store.pipe(select(getKeyPairProvider), filterNull()).pipe(
      switchMap(provider => {
        currentUrl = this._getUrl(provider);
        return this.http.post<T>(currentUrl + path, body, options).pipe(
          timeout(5000),
          retryWhen(attempts => {
            return attempts.pipe(mergeMap(error => {
              retries++;
              const shouldRetry = (error instanceof HttpErrorResponse && error.status >= 500 || error.status === 0)
                || error instanceof TimeoutError;
              if (retries < 5 && shouldRetry) {
                this.unavailableExplorers.push(currentUrl);
                return timer(0);
              }
              return throwError(error);
            }));
          })
        );
      }),
    );
  }

  private _getUrl(provider: Provider) {
    // Reset unavailable explorers when all of them are unavailable
    let urls = provider.explorerUrls.filter(url => this.unavailableExplorers.indexOf(url) === -1);
    if (!urls.length) {
      this.unavailableExplorers = [];
      urls = provider.explorerUrls;
    }
    return urls[ Math.floor(Math.random() * urls.length) ];
  }
}

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, of, throwError, TimeoutError, timer } from 'rxjs';
import { map, mergeMap, retryWhen, switchMap, timeout } from 'rxjs/operators';
import { Provider } from '../configuration';
import {
  BlockFacts,
  COIN_TO_HASTINGS,
  CoinInput,
  CoinInput1,
  CoinOutput1,
  CreateSignatureData,
  CreateTransactionResult,
  ExplorerBlock,
  ExplorerBlockGET,
  ExplorerHashGET,
  ExplorerTransaction,
  InputType,
  OutputType,
  ParsedTransaction,
  PendingTransaction,
  Transaction1,
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
        .map(t => convertTransaction(t, address, latestBlock, inputs, true))
        .sort((t1, t2) => t2.height - t1.height);
    }));
  }

  getHashInfo(hash: string) {
    return this._get<ExplorerHashGET>(`/explorer/hashes/${hash}`);
  }

  getTransactionPool(address: string) {
    return this._get<TransactionPool>(`/transactionpool/transactions?unlockhash=${address}`);
  }

  /**
   * Get a verified or pending transaction by its id.
   * This needs a history of all transactions for the user his address so we can know which inputs belong to the user, which in turn
   * makes it possible to know if a transaction was 'send' or 'received'.
   */
  getTransaction(transactionId: string, address: string, transactions: ExplorerTransaction[],
                 latestBlock: ExplorerBlock): Observable<ParsedTransaction> {
    return this.getHashInfo(transactionId).pipe(
      map(explorerTransaction => {
        const inputs = getInputIds(transactions, address, latestBlock).all;
        return convertTransaction(convertToV1Transaction(explorerTransaction.transaction), address, latestBlock, inputs,
          !explorerTransaction.unconfirmed);
      }));
  }

  /**
   * Get all transactions that are currently in the pool for a specific address
   */
  getPendingTransactions(address: string, hashInfo: ExplorerHashGET | null, latestBlock: ExplorerBlock): Observable<PendingTransaction[]> {
    return this.getTransactionPool(address).pipe(
      map(pool => {
        const inputs = hashInfo ? getInputIds(hashInfo.transactions, address, latestBlock).all : [];
        // filterTransactionByAddress shouldn't be needed anymore
        // Transactions filtered by explorer by using the `unlockhash` query parameter, but we're doing it regardless
        return (pool.transactions || []).filter(t => filterTransactionsByAddress(address, t) && t.version <= 1)
          .map(t => convertToV1RawTransaction(t))
          .map(t => convertPendingTransaction(t, address, latestBlock, inputs));
      }));
  }

  createSignatureData(data: CreateSignatureData, pendingTransactions: PendingTransaction[],
                      latestBlock: ExplorerBlock): Observable<Transaction1> {
    return this.getHashInfo(data.from_address).pipe(map(hashInfo => {
      const minerfees = (COIN_TO_HASTINGS / 10);
      let inputIds = getInputIds(hashInfo.transactions, data.from_address, latestBlock).available;
      const pendingOutputIds = pendingTransactions
        .map(transaction => <CoinInput[]>(transaction.data.coininputs || []))
        .reduce((total: string[], inputs) => [ ...total, ...inputs.map(input => input.parentid) ], []);
      inputIds = inputIds.filter(o => pendingOutputIds.indexOf(o.id) === -1);
      const required = data.amount * COIN_TO_HASTINGS / Math.pow(10, data.precision);
      const requiredFunds = required + minerfees;
      const totalFunds = inputIds.reduce((total, output) => total + parseInt(output.amount), 0);
      if (requiredFunds > totalFunds) {
        throw new TranslatedError('insufficient_funds');
      }
      let inputValue = 0;
      const transactionInputs: CoinInput1[] = [];
      const transactionOutputs: CoinOutput1[] = [];
      for (const inputId of inputIds) {
        transactionInputs.push({
          parentid: inputId.id,
          fulfillment: {
            type: InputType.SINGLE_SIGNATURE,
            data: {
              publickey: 'ed25519:',  // Will be set via the golang lib
              signature: ''  // Will be set later when we know what to sign
            }
          }
        });
        inputValue += parseInt(inputId.amount);
        if (inputValue >= requiredFunds) {
          // done
          break;
        }
      }
      transactionOutputs.push({
        condition: {
          type: OutputType.UNLOCKHASH,
          data: {
            unlockhash: data.to_address
          }
        },
        value: required.toString()
      });
      // Send the rest (if any) to our address
      const difference = inputValue - requiredFunds;
      if (difference > 0) {
        transactionOutputs.push({
          condition: {
            type: OutputType.UNLOCKHASH,
            data: {
              unlockhash: data.from_address
            }
          },
          value: difference.toString()
        });
      }
      const t = <Transaction1>{
        version: 1,
        data: {
          coininputs: transactionInputs,
          coinoutputs: transactionOutputs,
          minerfees: [minerfees.toString()],
        }
      };
      return t;
    }));
  }

  createTransaction(transaction: Transaction1) {
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

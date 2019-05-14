import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, of, throwError, TimeoutError, timer } from 'rxjs';
import { map, mergeMap, retryWhen, switchMap, timeout } from 'rxjs/operators';
import { Provider } from '../configuration';
import {
  ADDRESS_REGISTRATION_FEE,
  BlockFacts,
  COIN_TO_HASTINGS,
  CoinInput,
  CoinInput1,
  CoinOutput1,
  CreateSignatureData,
  CreateTransactionResult,
  CreateTransactionType,
  ERC20AddressRegistrationTransaction,
  ERC20ConvertTransaction,
  ExplorerBlock,
  ExplorerBlockGET,
  ExplorerHashGET,
  ExplorerHashGETResult,
  InputType,
  OutputType,
  ParsedTransaction,
  PendingTransaction,
  SUPPORTED_TRANSACTION_TYPES,
  Transaction1,
  TransactionPool,
  TransactionVersion,
  TranslatedError,
} from '../interfaces';
import { getKeyPairProvider, IAppState } from '../state';
import {
  convertPendingTransaction,
  convertToV1RawTransaction,
  convertToV1Transaction,
  convertTransaction,
  filterNull,
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
        .filter(t => SUPPORTED_TRANSACTION_TYPES.includes(t.rawtransaction.version))
        .map(t => convertToV1Transaction(t))
        .map(t => convertTransaction(t, address, latestBlock, inputs))
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
   * Get a verified or pending transaction by its id
   */
  getTransaction(transactionId: string, address: string, latestBlock: ExplorerBlock): Observable<ParsedTransaction> {
    // force type as we're sure the transaction exists
    return (this.getHashInfo(transactionId) as Observable<ExplorerHashGETResult>).pipe(
      map(explorerTransaction => {
        const inputs = getInputIds([explorerTransaction.transaction], address, latestBlock).all;
        return convertTransaction(convertToV1Transaction(explorerTransaction.transaction), address, latestBlock, inputs);
      }));
  }

  /**
   * Get all transactions that are currently in the pool for a specific address
   */
  getPendingTransactions(address: string, hashInfo: ExplorerHashGET | null, latestBlock: ExplorerBlock): Observable<PendingTransaction[]> {
    return this.getTransactionPool(address).pipe(
      map(pool => {
        const inputs = hashInfo ? getInputIds(hashInfo.transactions, address, latestBlock).all : [];
        return (pool.transactions || [])
          .map(t => t.version === TransactionVersion.ZERO ? convertToV1RawTransaction(t) : t)
          .map(t => convertPendingTransaction(<CreateTransactionType>t, address, latestBlock, inputs));
      }));
  }

  createSignatureData(data: CreateSignatureData, pendingTransactions: PendingTransaction[],
                      latestBlock: ExplorerBlock): Observable<CreateTransactionType> {
    return this.getHashInfo(data.from_address).pipe(map(hashInfo => {
      if (!hashInfo) {
        throw new TranslatedError('insufficient_funds');
      }
      const minerfees = (COIN_TO_HASTINGS / 10);
      let inputIds = getInputIds(hashInfo.transactions, data.from_address, latestBlock).available;
      inputIds = inputIds.sort((first, second) => parseInt(second.amount) - parseInt(first.amount));
      const pendingOutputIds = pendingTransactions
        .map(transaction => <CoinInput[]>(transaction.transaction.data.coininputs || []))
        .reduce((total: string[], inputs) => [ ...total, ...inputs.map(input => input.parentid) ], []);
      inputIds = inputIds.filter(o => pendingOutputIds.indexOf(o.id) === -1);
      const required = data.amount * COIN_TO_HASTINGS / Math.pow(10, data.precision);
      let requiredFunds = required + minerfees;
      if (data.version === TransactionVersion.ERC20AddressRegistration) {
        requiredFunds += ADDRESS_REGISTRATION_FEE;
      }
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
      let restOutput: CoinOutput1 | null = null;
      if (difference > 0) {
        restOutput = {
          condition: {
            type: OutputType.UNLOCKHASH,
            data: {
              unlockhash: data.from_address
            }
          },
          value: difference.toString()
        };
        transactionOutputs.push(restOutput);
      }
      switch (data.version) {
        case TransactionVersion.ERC20Conversion:
          return <ERC20ConvertTransaction>{
            version: TransactionVersion.ERC20Conversion,
            data: {
              address: data.to_address,
              value: required.toString(),
              txfee: minerfees.toString(),
              coininputs: transactionInputs,
              refundcoinoutput: restOutput,
            }
          };
        case TransactionVersion.ERC20AddressRegistration:
          return <ERC20AddressRegistrationTransaction>{
            version: TransactionVersion.ERC20AddressRegistration,
            data: {
              pubkey: 'ed25519:',  // Will be set via the golang lib
              signature: '',  // will be set later
              regfee: ADDRESS_REGISTRATION_FEE.toString(),
              txfee: minerfees.toString(),
              coininputs: transactionInputs,
              refundcoinoutput: restOutput,
            }
          };
        default:
          return <Transaction1>{
            version: TransactionVersion.ONE,
            data: {
              coininputs: transactionInputs,
              coinoutputs: transactionOutputs,
              minerfees: [minerfees.toString()],
            }
          };
      }
    }));
  }

  createTransaction(transaction: CreateTransactionType) {
    return this._post<CreateTransactionResult>(`/transactionpool/transactions`, transaction);
  }

  /**
   * Executes a GET request to one of the available explorers.
   * Should the request fail, it is retried 4 more times to different explorers.
   */
  private _get<T>(path: string, options?: { headers?: HttpHeaders | { [ header: string ]: string | string[] } }) {
    let currentHost: string;
    let fullUrl: string;
    let retries = 0;
    return this.store.pipe(select(getKeyPairProvider), filterNull()).pipe(
      switchMap(provider => {
          currentHost = this._getUrl(provider);
          fullUrl = currentHost + path;
          console.log(`GET ${fullUrl}`);
          return this.http.get<T>(fullUrl, options).pipe(timeout(5000));
        }
      ),
      retryWhen(attempts => {
        return attempts.pipe(mergeMap(error => {
          retries++;
          console.warn(`GET ${fullUrl} failed (attempt ${retries})`);
          if (error instanceof HttpErrorResponse && typeof error.error === 'object'
            && isUnrecognizedHashError(error.error.message)) {
            // Don't retry in case the hash wasn't recognized
            return throwError(error);
          }
          const shouldRetry = (error instanceof HttpErrorResponse && error.status >= 500 || error.status === 0)
            || error instanceof TimeoutError;
          if (retries < 5 && shouldRetry) {
            this.setExplorerUnavailable(currentHost);
            return timer(0);
          }
          if (shouldRetry) {
            throw new TranslatedError('explorers_unavailable');
          }
          return throwError(error);
        }));
      })
    );
  }

  private _post<T>(path: string, body: any | null, options?: { headers?: HttpHeaders | { [ header: string ]: string | string[] } }) {
    let currentHost: string;
    let fullUrl: string;
    let retries = 0;
    return this.store.pipe(select(getKeyPairProvider), filterNull()).pipe(
      switchMap(provider => {
        currentHost = this._getUrl(provider);
        fullUrl = currentHost + path;
        console.log(`POST ${fullUrl}`);
        return this.http.post<T>(fullUrl, body, options).pipe(timeout(5000));
      }),
      retryWhen(attempts => {
        return attempts.pipe(mergeMap(error => {
          retries++;
          console.warn(`POST ${fullUrl} failed (attempt ${retries})`);
          const shouldRetry = (error instanceof HttpErrorResponse && error.status >= 500 || error.status === 0)
            || error instanceof TimeoutError;
          if (retries < 5 && shouldRetry) {
            this.setExplorerUnavailable(currentHost);
            return timer(0);
          }
          if (shouldRetry) {
            throw new TranslatedError('explorers_unavailable');
          }
          return throwError(error);
        }));
      }),
    );
  }

  private setExplorerUnavailable(url: string) {
    console.log(`Marking explorer ${url} as unavailable`);
    this.unavailableExplorers.push(url);
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

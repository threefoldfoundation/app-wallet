import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { combineLatest, of } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import * as actions from '../actions';
import { WalletService } from '../services';
import { getAddress, getHashInfo, getHashInfoStatus, getLatestBlock, IAppState } from '../state';
import { filterNull, handleError, isUnrecognizedHashError } from '../util';

@Injectable()
export class WalletEffects {

  @Effect() getHashInfo$ = this.actions$.pipe(
    ofType<actions.GetHashInfoAction>(actions.WalletActionTypes.GET_HASH_INFO),
    switchMap(action => this.walletService.getHashInfo(action.address).pipe(
      map(transactions => new actions.GetHashInfoCompleteAction(transactions)),
      catchError(err => handleError(actions.GetHashInfoFailedAction, err))),
    ));

  @Effect() getHashInfoFailedSideEffects$ = this.actions$.pipe(
    ofType<actions.GetHashInfoFailedAction>(actions.WalletActionTypes.GET_HASH_INFO_FAILED),
    filter(action => action.payload.error != null && isUnrecognizedHashError(action.payload.error.error)),
    withLatestFrom(this.store.pipe(select(getAddress), filterNull())),
    switchMap(([action, address]) => of(new actions.GetTransactionsAction(address.address)))
  );

  @Effect() getTransactions$ = this.actions$.pipe(
    ofType<actions.GetTransactionsAction>(actions.WalletActionTypes.GET_TRANSACTIONS),
    withLatestFrom(this.store.pipe(select(getLatestBlock), filterNull()), this.store.pipe(select(getHashInfo))),
    switchMap(([action, latestBlock, hashInfo]) => this.walletService.getTransactions(action.address, hashInfo, latestBlock).pipe(
      map(transactions => new actions.GetTransactionsCompleteAction(transactions)),
      catchError(err => handleError(actions.GetTransactionsFailedAction, err))),
    ));

  @Effect() afterGetTransactionsComplete$ = this.actions$.pipe(
    ofType<actions.GetTransactionsCompleteAction>(actions.WalletActionTypes.GET_TRANSACTIONS_COMPLETE),
    withLatestFrom(this.store.pipe(select(getAddress), filterNull())),
    switchMap(([action, address]) => of(new actions.GetPendingTransactionsAction(address.address)))
  );

  @Effect() getPendingTransactions$ = this.actions$.pipe(
    ofType<actions.GetPendingTransactionsAction>(actions.WalletActionTypes.GET_PENDING_TRANSACTIONS),
    withLatestFrom(this.store.pipe(select(getLatestBlock), filterNull()), this.store.pipe(select(getHashInfo))),
    switchMap(([action, latestBlock, hashInfo]) => this.walletService.getPendingTransactions(action.address, hashInfo, latestBlock).pipe(
      map(transactions => new actions.GetPendingTransactionsCompleteAction(transactions)),
      catchError(err => handleError(actions.GetPendingTransactionsFailedAction, err))),
    ));

  @Effect() createSignatureData$ = this.actions$.pipe(
    ofType<actions.CreateSignatureDataAction>(actions.WalletActionTypes.CREATE_SIGNATURE_DATA),
    withLatestFrom(this.store.pipe(select(getLatestBlock), filterNull())),
    switchMap(([action, block]) => this.walletService.createSignatureData(action.payload, action.pendingTransactions, block).pipe(
      map(result => new actions.CreateSignatureDataCompleteAction(result)),
      catchError(err => handleError(actions.CreateSignatureDataFailedAction, err))),
    ));

  @Effect() createTransactionDataSuccess$ = this.actions$.pipe(
    ofType<actions.CreateTransactionDataCompleteAction>(actions.RogerthatActionTypes.CREATE_TRANSACTION_DATA_COMPLETE),
    switchMap(action => this.walletService.createTransaction(action.payload).pipe(
      map(result => new actions.CreateTransactionCompleteAction(result)),
      catchError(err => handleError(actions.CreateTransactionFailedAction, err))),
    ));

  @Effect() createTransactionDataFailed$ = this.actions$.pipe(
    ofType<actions.CreateTransactionDataFailedAction>(actions.RogerthatActionTypes.CREATE_TRANSACTION_DATA_FAILED),
    switchMap(action => of(new actions.CreateTransactionFailedAction(action.payload))),
  );

  @Effect() getLatestBlock$ = this.actions$.pipe(
    ofType<actions.GetLatestBlockAction>(actions.WalletActionTypes.GET_LATEST_BLOCK),
    switchMap(action => this.walletService.getLatestBlock().pipe(
      map(result => new actions.GetLatestBlockCompleteAction(result.block)),
      catchError(err => handleError(actions.GetLatestBlockFailedAction, err))),
    ));

  @Effect() getBlock$ = this.actions$.pipe(
    ofType<actions.GetBlockAction>(actions.WalletActionTypes.GET_BLOCK),
    switchMap(action => this.walletService.getBlock(action.height).pipe(
      map(result => new actions.GetBlockCompleteAction(result)),
      catchError(err => handleError(actions.GetBlockFailedAction, err))),
    ));

  constructor(private actions$: Actions<actions.WalletActions>,
              private store: Store<IAppState>,
              private walletService: WalletService) {
    combineLatest(this.store.pipe(select(getHashInfoStatus)),
      this.store.pipe(select(getLatestBlock)),
      this.store.pipe(select(getAddress))
    ).subscribe(([hashInfoStatus, latestBlock, address]) => {
      const hasHashInfo = (hashInfoStatus.success || hashInfoStatus.error != null && isUnrecognizedHashError(hashInfoStatus.error.error));
      if (hasHashInfo && latestBlock && address) {
        this.store.dispatch(new actions.GetTransactionsAction(address.address));
      }
    });
  }
}

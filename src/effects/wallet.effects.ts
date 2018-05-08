import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import * as actions from '../actions';
import {
  CreateTransactionDataCompleteAction,
  CreateTransactionDataFailedAction,
  GetBlockAction,
  GetLatestBlockAction,
  WalletActions
} from '../actions';
import { WalletService } from '../services';
import { getLatestBlock, IAppState } from '../state';
import { filterNull, handleError } from '../util';

@Injectable()
export class WalletEffects {
  @Effect() getTransactions$ = this.actions$.pipe(
    ofType<actions.GetTransactionsAction>(actions.WalletActionTypes.GET_TRANSACTIONS),
    withLatestFrom(this.store.pipe(select(getLatestBlock), filterNull())),
    switchMap(([action, latestBlock]) => this.walletService.getTransactions(action.address, latestBlock).pipe(
      map(transactions => new actions.GetTransactionsCompleteAction(transactions)),
      catchError(err => handleError(actions.GetTransactionsFailedAction, err))),
    ));

  @Effect() getPendingTransactions$ = this.actions$.pipe(
    ofType<actions.GetPendingTransactionsAction>(actions.WalletActionTypes.GET_PENDING_TRANSACTIONS),
    switchMap(action => this.walletService.getPendingTransactions(action.address, action.inputIds).pipe(
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
    ofType<CreateTransactionDataCompleteAction>(actions.RogerthatActionTypes.CREATE_TRANSACTION_DATA_COMPLETE),
    switchMap(action => this.walletService.createTransaction(action.payload).pipe(
      map(result => new actions.CreateTransactionCompleteAction(result)),
      catchError(err => handleError(actions.CreateTransactionFailedAction, err))),
    ));

  @Effect() createTransactionDataFailed$ = this.actions$.pipe(
    ofType<CreateTransactionDataFailedAction>(actions.RogerthatActionTypes.CREATE_TRANSACTION_DATA_FAILED),
    switchMap(action => of(new actions.CreateTransactionFailedAction(action.payload))),
  );

  @Effect() getLatestBlock$ = this.actions$.pipe(
    ofType<GetLatestBlockAction>(actions.WalletActionTypes.GET_LATEST_BLOCK),
    switchMap(action => this.walletService.getLatestBlock().pipe(
      map(result => new actions.GetLatestBlockCompleteAction(result.block)),
      catchError(err => handleError(actions.GetLatestBlockFailedAction, err))),
    ));

  @Effect() getBlock$ = this.actions$.pipe(
    ofType<GetBlockAction>(actions.WalletActionTypes.GET_BLOCK),
    switchMap(action => this.walletService.getBlock(action.height).pipe(
      map(result => new actions.GetBlockCompleteAction(result)),
      catchError(err => handleError(actions.GetBlockFailedAction, err))),
    ));

  constructor(private actions$: Actions<WalletActions>,
              private store: Store<IAppState>,
              private walletService: WalletService) {
  }
}

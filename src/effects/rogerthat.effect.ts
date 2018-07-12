import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RogerthatActions } from '../actions';
import * as actions from '../actions/rogerthat.actions';
import { RogerthatService } from '../services';
import { handleError } from '../util';

@Injectable()
export class RogerthatEffects {

  @Effect() scanQrCode$ = this.actions$.pipe(
    ofType<actions.ScanQrCodeAction>(actions.RogerthatActionTypes.SCAN_QR_CODE),
    switchMap(action => this.rogerthatService.startScanningQrCode(action.payload).pipe(
      // Actual result is dispatched in rogerthatService via rogerthat.callbacks.qrCodeScanned
      map(() => new actions.ScanQrCodeStartedAction()),
      catchError(err => handleError(actions.ScanQrCodeFailedAction, err))),
    ));

  @Effect() getAddress$ = this.actions$.pipe(
    ofType<actions.GetAddresssAction>(actions.RogerthatActionTypes.GET_ADDRESS),
    switchMap(action => this.rogerthatService.getAddress(action.payload).pipe(
      map(address => new actions.GetAddresssCompleteAction(address)),
      catchError(err => handleError(actions.GetAddresssFailedAction, err))),
    ));

  @Effect() createTransactionData$ = this.actions$.pipe(
    ofType<actions.CreateTransactionDataAction>(actions.RogerthatActionTypes.CREATE_TRANSACTION_DATA),
    switchMap(action => this.rogerthatService.createTransactionData(action.payload, action.algorithm, action.keyName,
      action.index, action.message).pipe(
      map(transaction => new actions.CreateTransactionDataCompleteAction(transaction)),
      catchError(err => handleError(actions.CreateTransactionDataFailedAction, err))),
    ));

  @Effect() listSecurityKeys$ = this.actions$.pipe(
    ofType<actions.ListKeyPairsAction>(actions.RogerthatActionTypes.LIST_KEY_PAIRS),
    switchMap(() => this.rogerthatService.listKeyPairs().pipe(
      map(keys => new actions.ListKeyPairsCompleteAction(keys)),
      catchError(err => handleError(actions.ListKeyPairsFailedAction, err))),
    ));


  @Effect() createKeyPair$ = this.actions$.pipe(
    ofType<actions.CreateKeyPairAction>(actions.RogerthatActionTypes.CREATE_KEYPAIR),
    switchMap(action => this.rogerthatService.createKeyPair(action.payload).pipe(
      map(keyPair => new actions.CreateKeyPairCompleteAction(keyPair)),
      catchError(err => handleError(actions.CreateKeyPairFailedAction, err))),
    ));

  constructor(private actions$: Actions<RogerthatActions>,
              private rogerthatService: RogerthatService) {
  }
}

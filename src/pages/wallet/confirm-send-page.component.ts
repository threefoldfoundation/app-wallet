import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, NavParams, ViewController } from 'ionic-angular';
import { CryptoTransaction } from 'rogerthat-plugin';
import { Observable } from 'rxjs/Observable';
import { first, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { CreateSignatureDataAction, CreateTransactionDataAction, WalletActionTypes } from '../../actions';
import {
  ApiRequestStatus,
  CreateSignatureData,
  KEY_NAME,
  RIVINE_ALGORITHM,
  RivineCreateTransactionResult,
} from '../../interfaces';
import {
  createTransactionStatus,
  getCreatedTransaction,
  getPendingTransaction,
  getPendingTransactionStatus,
  IAppState,
} from '../../state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'confirm-send-page.component.html',
})
export class ConfirmSendPageComponent implements OnInit, OnDestroy {
  data: CreateSignatureData;
  pendingTransaction$: Observable<CryptoTransaction | null>;
  pendingTransactionStatus$: Observable<ApiRequestStatus>;
  createTransactionStatus$: Observable<ApiRequestStatus>;
  transaction$: Observable<RivineCreateTransactionResult | null>;

  private _transactionCompleteSub: Subscription;

  constructor(private store: Store<IAppState>,
              private viewCtrl: ViewController,
              private alertCtrl: AlertController,
              private params: NavParams,
              private translate: TranslateService,
              private actions$: Actions) {
  }

  dismiss() {
    this.viewCtrl.dismiss(null);
  }

  ngOnInit() {
    this.data = this.params.get('transactionData');
    this.store.dispatch(new CreateSignatureDataAction(this.data));
    this.pendingTransaction$ = this.store.pipe(select(getPendingTransaction));
    this.pendingTransactionStatus$ = this.store.pipe(select(getPendingTransactionStatus));
    this.createTransactionStatus$ = this.store.pipe(select(createTransactionStatus));
    this.transaction$ = this.store.pipe(select(getCreatedTransaction));
    this._transactionCompleteSub = this.actions$.pipe(
      ofType(WalletActionTypes.CREATE_TRANSACTION_COMPLETE),
      switchMap(() => this.transaction$),
    ).subscribe(transaction => {
      this.viewCtrl.dismiss(transaction);
    });
  }

  ngOnDestroy() {
    this._transactionCompleteSub.unsubscribe();
  }

  onConfirm() {
    const msg = this.translate.instant('enter_your_pin_to_sign_transaction');
    this.pendingTransaction$.pipe(first()).subscribe(transaction => {
      this.store.dispatch(new CreateTransactionDataAction(transaction!, KEY_NAME, RIVINE_ALGORITHM, 0, msg));
    });
  }
}


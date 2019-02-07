import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, NavParams, ViewController } from 'ionic-angular';
import { CryptoAddress, KeyPair } from 'rogerthat-plugin';
import { Observable, Subscription } from 'rxjs';
import { first, switchMap, withLatestFrom } from 'rxjs/operators';
import {
  CreateSignatureDataAction,
  CreateTransactionDataAction,
  GetHashInfoAction,
  GetPendingTransactionsCompleteAction,
  WalletActionTypes,
} from '../../actions';
import { Provider } from '../../configuration';
import { ApiRequestStatus, CreateSignatureData, CreateTransactionResult, PayChatTransactionResult, Transaction1 } from '../../interfaces';
import {
  createTransactionStatus,
  getAddress,
  getConfirmSendTransactionStatus,
  getCreatedTransaction,
  getKeyPairProvider,
  getPendingTransaction,
  getSelectedKeyPair,
  IAppState,
} from '../../state';
import { filterNull } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'confirm-send-page.component.html',
})
export class ConfirmSendPageComponent implements OnInit, OnDestroy {
  data: CreateSignatureData;
  pendingTransaction$: Observable<Transaction1>;
  pendingTransactionStatus$: Observable<ApiRequestStatus>;
  createTransactionStatus$: Observable<ApiRequestStatus>;
  transaction$: Observable<CreateTransactionResult>;
  keyPair$: Observable<KeyPair>;
  address$: Observable<CryptoAddress>;
  keyPairProvider$: Observable<Provider>;

  private _transactionCompleteSub: Subscription;
  private _pendingTransactionSubscription: Subscription;

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
    this.store.dispatch(new GetHashInfoAction(this.data.from_address));
    this._pendingTransactionSubscription = this.actions$.pipe(
      ofType<GetPendingTransactionsCompleteAction>(WalletActionTypes.GET_PENDING_TRANSACTIONS_COMPLETE),
      first(),
    ).subscribe(action => {
      this.store.dispatch(new CreateSignatureDataAction(this.data, action.payload));
    });
    this.pendingTransaction$ = this.store.pipe(select(getPendingTransaction), filterNull());
    this.pendingTransactionStatus$ = this.store.pipe(select(getConfirmSendTransactionStatus));
    this.createTransactionStatus$ = this.store.pipe(select(createTransactionStatus));
    this.transaction$ = this.store.pipe(select(getCreatedTransaction), filterNull());
    this.keyPair$ = this.store.pipe(select(getSelectedKeyPair), filterNull());
    this.keyPairProvider$ = this.store.pipe(select(getKeyPairProvider), filterNull());
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this._transactionCompleteSub = this.actions$.pipe(
      ofType(WalletActionTypes.CREATE_TRANSACTION_COMPLETE),
      switchMap(() => this.transaction$),
      withLatestFrom(this.keyPairProvider$)
    ).subscribe(([transaction, provider]) => {
      const result: PayChatTransactionResult = {
        transaction,
        provider_id: provider.providerId,
        from_address: this.data.from_address,
        to_address: this.data.to_address
      };
      this.viewCtrl.dismiss(result);
    });
  }

  ngOnDestroy() {
    this._transactionCompleteSub.unsubscribe();
    this._pendingTransactionSubscription.unsubscribe();
  }

  onConfirm() {
    const msg = this.translate.instant('enter_your_pin_to_sign_transaction');
    this.pendingTransaction$.pipe(
      first(),
      withLatestFrom(this.keyPair$.pipe(first())),
    ).subscribe(([ transaction, keyPair ]) => {
      this.store.dispatch(new CreateTransactionDataAction(transaction, keyPair.name, keyPair.algorithm, 0, msg));
    });
  }
}


import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, NavParams, ViewController } from 'ionic-angular';
import { CryptoTransaction } from 'rogerthat-plugin';
import { Observable } from 'rxjs/Observable';
import { first, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import {
  CreateSignatureDataAction,
  CreateTransactionDataAction,
  GetPendingTransactionsAction,
  GetPendingTransactionsCompleteAction,
  WalletActionTypes,
} from '../../actions';
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
  getTransactions,
  IAppState,
} from '../../state';
import { getOutputIds } from '../../util/wallet';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'confirm-send-page.component.html',
})
export class ConfirmSendPageComponent implements OnInit, OnDestroy {
  data: CreateSignatureData;
  pendingTransaction$: Observable<CryptoTransaction | null>;
  pendingTransactionStatus$: Observable<ApiRequestStatus>;
  createTransactionStatus$: Observable<ApiRequestStatus>;
  transaction$: Observable<RivineCreateTransactionResult | null>;

  private _transactionCompleteSub: Subscription;
  private _transactionsSubscription: Subscription;
  private _pendingTransactionSubscription: Subscription | null = null;

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
    // Ensure latest data by fetching it again
    this._transactionsSubscription = this.store.pipe(select(getTransactions)).subscribe(transactions => {
      const outputIds = getOutputIds(transactions, this.data.from_address).all.map(o => o.id);
      this._pendingTransactionSubscription = this.actions$.pipe(
        ofType<GetPendingTransactionsCompleteAction>(WalletActionTypes.GET_PENDING_TRANSACTIONS_COMPLETE),
        first(),
      ).subscribe(action => {
        this.store.dispatch(new CreateSignatureDataAction(this.data, action.payload));
      });
      this.store.dispatch(new GetPendingTransactionsAction(this.data.from_address, outputIds));
    });
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
    this._transactionsSubscription.unsubscribe();
    this._transactionCompleteSub.unsubscribe();
    if (this._pendingTransactionSubscription) {
      this._pendingTransactionSubscription.unsubscribe();
    }
  }

  onConfirm() {
    const msg = this.translate.instant('enter_your_pin_to_sign_transaction');
    this.pendingTransaction$.pipe(first()).subscribe(transaction => {
      this.store.dispatch(new CreateTransactionDataAction(transaction!, KEY_NAME, RIVINE_ALGORITHM, 0, msg));
    });
  }
}


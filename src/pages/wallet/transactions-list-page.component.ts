import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Alert, AlertController, ModalController, Refresher } from 'ionic-angular';
import { CryptoAddress, RogerthatError } from 'rogerthat-plugin';
import { Observable } from 'rxjs/Observable';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { first, withLatestFrom } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import {
  GetAddresssAction,
  GetLatestBlockAction,
  GetPendingTransactionsAction,
  GetTransactionsAction,
  GetTransactionsCompleteAction,
  GetTransactionsFailedAction,
  WalletActionTypes,
} from '../../actions';
import { ApiRequestStatus, KEY_NAME, ParsedTransaction, PendingTransaction, RIVINE_ALGORITHM, } from '../../interfaces';
import { ErrorService } from '../../services';
import {
  getAddress,
  getAddressStatus,
  getLatestBlock,
  getPendingTransactions,
  getTotalAmount,
  getTotalLockedAmount,
  getTransactions,
  getTransactionsStatus,
  IAppState,
} from '../../state';
import { filterNull, getInputIds, isPendingTransaction, isUnrecognizedHashError } from '../../util';
import { PendingTransactionDetailPageComponent } from './pending-transaction-detail-page.component';
import { TransactionDetailPageComponent } from './transaction-detail-page.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  templateUrl: 'transactions-list-page.component.html',
  styles: [`.send-receive-text {
    text-transform: uppercase;
    font-weight: bold;
  }`],
})
export class TransactionsListPageComponent implements OnInit, OnDestroy {
  @ViewChild(Refresher) refresher: Refresher;
  totalAmount$: Observable<number>;
  totalLocked$: Observable<number>;
  address$: Observable<CryptoAddress | null>;
  addressStatus$: Observable<ApiRequestStatus<RogerthatError>>;
  transactions$: Observable<ParsedTransaction[]>;
  pendingTransactions$: Observable<PendingTransaction[]>;
  transactionsStatus$: Observable<ApiRequestStatus>;
  address: CryptoAddress;
  showInitialLoading = true;
  digits = '1.0-2';

  private _subscriptions: Subscription[] = [];
  private errorAlert: Alert | null;

  constructor(private store: Store<IAppState>,
              private translate: TranslateService,
              private errorService: ErrorService,
              private alertCtrl: AlertController,
              private modalController: ModalController,
              private actions$: Actions) {
  }

  ngOnInit() {
    this.store.dispatch(new GetAddresssAction({
      algorithm: RIVINE_ALGORITHM,
      index: 0,
      keyName: KEY_NAME,
      message: this.translate.instant('please_enter_your_pin'),
    }));
    this.address$ = this.store.pipe(select(getAddress));
    this.addressStatus$ = this.store.pipe(select(getAddressStatus));
    this._subscriptions.push(this.actions$.pipe(
      ofType<GetTransactionsCompleteAction>(WalletActionTypes.GET_TRANSACTIONS_COMPLETE),
      withLatestFrom(this.store.pipe(select(getLatestBlock), filterNull())),
    ).subscribe(([action, latestBlock]) => {
      const inputIds = getInputIds(action.payload, this.address.address, latestBlock).all.map(o => o.id);
      this.store.dispatch(new GetPendingTransactionsAction(this.address.address, inputIds));
    }));
    this._subscriptions.push(this.actions$.pipe(
      ofType<GetTransactionsFailedAction>(WalletActionTypes.GET_TRANSACTIONS_FAILED)
    ).subscribe(result => {
      if (result.payload.error && isUnrecognizedHashError(result.payload.error.error)) {
        this.store.dispatch(new GetPendingTransactionsAction(this.address.address, []));
      }
    }));
    this.transactions$ = this.store.pipe(select(getTransactions));
    this.pendingTransactions$ = this.store.pipe(select(getPendingTransactions));
    this.transactionsStatus$ = this.store.pipe(select(getTransactionsStatus));
    this.totalAmount$ = this.store.pipe(select(getTotalAmount));
    this.totalLocked$ = this.store.pipe(select(getTotalLockedAmount));
    this._subscriptions.push(this.addressStatus$.subscribe(s => {
      if (!s.success && !s.loading && s.error !== null) {
        return this._showErrorDialog(s.error.error);
      } else if (s.success) {
        this.getTransactions();
      }
    }));
    this._subscriptions.push(this.transactionsStatus$.subscribe(s => {
      if (!s.success && !s.loading && s.error !== null && !isUnrecognizedHashError(s.error.error)) {
        this._showErrorDialog(s.error.error);
      } else if (!s.loading) {
        this.refresher.complete();
        this._dismissErrorDialog();
        this.showInitialLoading = false;
      }
    }));
    // Refresh transactions every 5 minutes
    this._subscriptions.push(IntervalObservable.create(300000).subscribe(() => this.getTransactions()));
  }

  ngOnDestroy() {
    for (const subscription of this._subscriptions) {
      subscription.unsubscribe();
    }
  }

  trackTransactions(index: number, transaction: ParsedTransaction) {
    return transaction.id;
  }

  getTransactions() {
    this.address$.pipe(first()).subscribe((address: CryptoAddress | null) => {
      if (address) {
        this.address = address;
        this.store.dispatch(new GetLatestBlockAction());
        this.store.dispatch(new GetTransactionsAction(address.address));
      }
    });
  }

  getColor(transaction: ParsedTransaction) {
    return transaction.receiving ? 'default' : 'danger';
  }

  showDetails(transaction: ParsedTransaction | PendingTransaction) {
    const page = isPendingTransaction(transaction) ? PendingTransactionDetailPageComponent : TransactionDetailPageComponent;
    this.modalController.create(page, { transaction }).present();
  }

  getColorClass(transaction: ParsedTransaction) {
    return `color-${this.getColor(transaction)} send-receive-text`;
  }

  _showErrorDialog(err: string) {
    this.refresher.complete();
    const msg = this.errorService.getErrorMessage(err);
    if (this.errorAlert) {
      this._dismissErrorDialog().then(() => this._showErrorDialog(err));
    } else {
      this.errorAlert = this.alertCtrl.create({
        title: this.translate.instant('error'),
        message: msg,
        buttons: [this.translate.instant('ok')],
      });
      this.errorAlert.present();
      this.errorAlert.onDidDismiss(() => {
        this.errorAlert = null;
      });
    }
  }

  private _dismissErrorDialog() {
    if (this.errorAlert) {
      return this.errorAlert.dismiss(() => {
        this.errorAlert = null;
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  }
}

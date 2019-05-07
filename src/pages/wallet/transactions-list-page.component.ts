import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Alert, AlertController, ModalController, Refresher } from 'ionic-angular';
import { CryptoAddress } from 'rogerthat-plugin';
import { combineLatest, interval, Observable, Subscription } from 'rxjs';
import { first, map, withLatestFrom } from 'rxjs/operators';
import { GetAddresssAction, GetHashInfoAction } from '../../actions';
import { ApiRequestStatus, ExplorerBlock, ParsedTransaction, PendingTransaction } from '../../interfaces';
import { ErrorService } from '../../services';
import {
  getAddress,
  getLatestBlock,
  getLatestBlockStatus,
  getPendingTransactions,
  getSelectedKeyPair,
  getTotalLockedAmount,
  getTotalUnlockedAmount,
  getTransactions,
  getTransactionsStatus,
  IAppState,
} from '../../state';
import { combineRequestStatuses, filterNull, isPendingTransaction, isUnrecognizedHashError } from '../../util';
import { PendingTransactionDetailPageComponent } from './pending-transaction-detail-page.component';
import { TransactionDetailPageComponent } from './transaction-detail-page.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  templateUrl: 'transactions-list-page.component.html',
  styles: [ `.send-receive-text {
    text-transform: uppercase;
    font-weight: bold;
  }` ],
})
export class TransactionsListPageComponent implements OnInit, OnDestroy {
  @ViewChild(Refresher) refresher: Refresher;
  totalUnlockedAmount$: Observable<number>;
  totalLocked$: Observable<number>;
  address$: Observable<CryptoAddress>;
  transactions$: Observable<ParsedTransaction[]>;
  pendingTransactions$: Observable<PendingTransaction[]>;
  loadingStatus$: Observable<ApiRequestStatus>;
  latestBlock$: Observable<ExplorerBlock>;
  digits = '1.0-9';

  private _subscriptions: Subscription[] = [];
  private errorAlert: Alert | null;

  constructor(private store: Store<IAppState>,
              private translate: TranslateService,
              private errorService: ErrorService,
              private alertCtrl: AlertController,
              private modalController: ModalController) {
  }

  ngOnInit() {
    this._subscriptions.push(this.store.pipe(select(getSelectedKeyPair), filterNull()).subscribe(keyPair =>
      this.store.dispatch(new GetAddresssAction({
        algorithm: keyPair.algorithm,
        index: 0,
        keyName: keyPair.name,
        message: this.translate.instant('please_enter_your_pin'),
      })),
    ));
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this.transactions$ = this.store.pipe(select(getTransactions));
    this.pendingTransactions$ = this.store.pipe(select(getPendingTransactions));
    this.loadingStatus$ = combineLatest(
      this.store.pipe(select(getTransactionsStatus)),
      this.store.pipe(select(getLatestBlockStatus)),
    ).pipe(map(([s1, s2]) => combineRequestStatuses(s1, s2)));
    this.totalUnlockedAmount$ = this.store.pipe(select(getTotalUnlockedAmount));
    this.totalLocked$ = this.store.pipe(select(getTotalLockedAmount));
    this.latestBlock$ = this.store.pipe(select(getLatestBlock), filterNull());
    this._subscriptions.push(this.address$.subscribe((address) => this.getTransactions(address.address)));
    this._subscriptions.push(this.loadingStatus$.subscribe(s => {
      if (!s.success && !s.loading && s.error !== null && !isUnrecognizedHashError(s.error.error)) {
        this._showErrorDialog(s.error.error);
      } else if (!s.loading) {
        this._dismissErrorDialog();
      }
    }));
    // Refresh transactions every 5 minutes
    this._subscriptions.push(
      interval(300000).pipe(withLatestFrom(this.address$)).subscribe(([ _, address ]) => this.getTransactions(address.address)),
    );
  }

  ngOnDestroy() {
    for (const subscription of this._subscriptions) {
      subscription.unsubscribe();
    }
  }

  trackTransactions(index: number, transaction: ParsedTransaction) {
    return transaction.id;
  }

  getTransactions(address: string) {
    this.store.dispatch(new GetHashInfoAction(address));
  }

  refreshTransactions() {
    this.refresher.complete();
    this.address$.pipe(first()).subscribe(address => this.getTransactions(address.address));
  }

  getColor(transaction: ParsedTransaction | PendingTransaction) {
    return transaction.receiving ? 'default' : 'danger';
  }

  showDetails(transaction: ParsedTransaction | PendingTransaction) {
    const page = isPendingTransaction(transaction) ? PendingTransactionDetailPageComponent : TransactionDetailPageComponent;
    this.modalController.create(page, { transaction }).present();
  }

  getColorClass(transaction: ParsedTransaction | PendingTransaction) {
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
        buttons: [ this.translate.instant('ok') ],
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
      }).catch(() => Promise.resolve()
      );
    }
    return Promise.resolve();
  }
}

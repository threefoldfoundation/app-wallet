import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Alert, AlertController, ModalController, Refresher } from 'ionic-angular';
import { CryptoAddress, RogerthatError } from 'rogerthat-plugin';
import { Observable } from 'rxjs/Observable';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { GetAddresssAction, GetTransactionsAction } from '../../actions';
import { ApiRequestStatus, CURRENCY_SYMBOL, KEY_NAME, ParsedTransaction, RIVINE_ALGORITHM } from '../../interfaces';
import { ErrorService } from '../../services';
import {
  getAddress,
  getAddressStatus,
  getTotalAmount,
  getTransactions,
  getTransactionsStatus,
  IAppState,
} from '../../state';
import { TransactionDetailPageComponent } from './transaction-detail-page.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'transactions-list-page.component.html',
  styles: [`.send-receive-text {
    text-transform: uppercase;
    font-weight: bold;
  }`],
})
export class TransactionsListPageComponent implements OnInit, OnDestroy {
  @ViewChild(Refresher) refresher: Refresher;
  symbol = CURRENCY_SYMBOL;
  totalAmount$: Observable<number>;
  address$: Observable<CryptoAddress | null>;
  addressStatus$: Observable<ApiRequestStatus<RogerthatError>>;
  transactions$: Observable<ParsedTransaction[]>;
  transactionsStatus$: Observable<ApiRequestStatus>;

  private _addressStatusSub: Subscription;
  private _transactionStatusSub: Subscription;
  private _intervalSubscription: Subscription;
  private errorAlert: Alert | null;

  constructor(private store: Store<IAppState>,
              private translate: TranslateService,
              private errorService: ErrorService,
              private alertCtrl: AlertController,
              private modalController: ModalController) {
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
    this.transactions$ = this.store.pipe(select(getTransactions));
    this.transactionsStatus$ = this.store.pipe(select(getTransactionsStatus));
    this.totalAmount$ = this.store.pipe(select(getTotalAmount));
    this._addressStatusSub = this.addressStatus$.subscribe(s => {
      if (!s.success && !s.loading && s.error !== null) {
        return this._showErrorDialog(s.error.error!);
      } else if (s.success) {
        this.getTransactions();
      }
    });
    this._transactionStatusSub = this.transactionsStatus$.subscribe(s => {
      if (!s.success && !s.loading && s.error !== null) {
        this._showErrorDialog(s.error!.error);
      } else if (!s.loading && s.success) {
        this.refresher.complete();
        this._dismissErrorDialog();
      }
    });
    // Refresh transactions every 5 minutes
    this._intervalSubscription = IntervalObservable.create(300000).subscribe(() => this.getTransactions());
  }

  ngOnDestroy() {
    this._addressStatusSub.unsubscribe();
    this._transactionStatusSub.unsubscribe();
    this._intervalSubscription.unsubscribe();
  }

  trackTransactions(index: number, transaction: ParsedTransaction) {
    return transaction.id;
  }

  getTransactions() {
    this.address$.pipe(first()).subscribe((address: CryptoAddress | null) => {
      if (address) {
        this.store.dispatch(new GetTransactionsAction(address.address));
      }
    });
  }

  getColor(transaction: ParsedTransaction) {
    return transaction.receiving ? 'default' : 'danger';
  }

  showDetails(transaction: ParsedTransaction) {
    this.modalController.create(TransactionDetailPageComponent, {transaction}).present();
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

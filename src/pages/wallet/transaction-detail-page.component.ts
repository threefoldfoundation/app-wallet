import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ToastController, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetBlockAction } from '../../actions';
import { ApiRequestStatus, ExplorerBlock, ExplorerBlockGET, ParsedTransaction } from '../../interfaces';
import { AmountPipe } from '../../pipes';
import { getBlock, getLatestBlock, getLatestBlockStatus, IAppState } from '../../state';
import { filterNull, isPendingTransaction } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'transaction-detail-page.component.html'
})
export class TransactionDetailPageComponent implements OnInit {
  transaction: ParsedTransaction;
  latestBlock$: Observable<ExplorerBlock>;
  transactionBlock$: Observable<ExplorerBlockGET>;
  getLatestBlockStatus$: Observable<ApiRequestStatus>;
  timestamp$: Observable<Date>;
  confirmations$: Observable<number>;

  constructor(private params: NavParams,
              private translate: TranslateService,
              private amountPipe: AmountPipe,
              private viewCtrl: ViewController,
              private toastCtrl: ToastController,
              private store: Store<IAppState>) {
  }

  ngOnInit() {
    this.transaction = this.params.get('transaction');
    this.latestBlock$ = this.store.pipe(select(getLatestBlock), filterNull());
    this.store.dispatch(new GetBlockAction(this.transaction.height));
    this.confirmations$ = this.latestBlock$.pipe(
      map(block => isPendingTransaction(this.transaction) ? 0 : block.height - this.transaction.height),
    );
    this.getLatestBlockStatus$ = this.store.pipe(select(getLatestBlockStatus));
    this.transactionBlock$ = this.store.pipe(
      select(getBlock),
      filterNull(),
    );
    this.timestamp$ = this.transactionBlock$.pipe(
      map(block => new Date(block.block.rawblock.timestamp * 1000)),
    );
  }

  getAmount(amount: number) {
    return this.amountPipe.transform(Math.abs(amount));
  }

  showCopiedToast(result: { isSuccess: boolean, content?: string }) {
    if (result.isSuccess) {
      this.toastCtrl.create({
        message: this.translate.instant('address_copied_to_clipboard'),
        duration: 3000,
        position: 'bottom',
        showCloseButton: true,
        closeButtonText: this.translate.instant('ok'),
      }).present();
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}

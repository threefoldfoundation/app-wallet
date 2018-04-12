import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ToastController, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { filter, map } from 'rxjs/operators';
import { GetBlockAction, GetLatestBlockAction } from '../../actions';
import {
  COIN_TO_HASTINGS_PRECISION,
  ParsedTransaction,
  PendingTransaction,
  RivineBlock,
  RivineBlockInternal,
} from '../../interfaces';
import { AmountPipe } from '../../pipes';
import { getBlock, getLatestBlock, IAppState } from '../../state';
import { isPendingTransaction } from '../../util/wallet';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'transaction-detail-page.component.html',
  styles: [`.input-output-list h2 {
    text-overflow: ellipsis;
    overflow: hidden;
  }`],
})
export class TransactionDetailPageComponent implements OnInit {
  transaction: ParsedTransaction | PendingTransaction;
  latestBlock$: Observable<RivineBlockInternal>;
  transactionBlock$: Observable<RivineBlock>;
  timestamp$: Observable<Date>;
  confirmations$: Observable<number>;
  isPendingTransaction = isPendingTransaction;
  digits = `1.0-${COIN_TO_HASTINGS_PRECISION}`;

  constructor(private params: NavParams,
              private translate: TranslateService,
              private amountPipe: AmountPipe,
              private viewCtrl: ViewController,
              private toastCtrl: ToastController,
              private store: Store<IAppState>) {
  }

  ngOnInit() {
    this.transaction = this.params.get('transaction');
    this.latestBlock$ = <Observable<RivineBlockInternal>>this.store.pipe(
      select(getLatestBlock),
      filter(b => b !== null),
    );
    if (isPendingTransaction(this.transaction)) {
      this.confirmations$ = of(0);
    } else {
      this.store.dispatch(new GetLatestBlockAction());
      this.store.dispatch(new GetBlockAction(this.transaction.height));
      this.confirmations$ = this.latestBlock$.pipe(
        map(block => isPendingTransaction(this.transaction) ? 0 : block.height - this.transaction.height),
      );
    }
    this.transactionBlock$ = <Observable<RivineBlock>>this.store.pipe(
      select(getBlock),
      filter(b => b !== null),
    );
    this.timestamp$ = this.transactionBlock$.pipe(
      map(block => new Date(block.block.rawblock.timestamp * 1000)),
    );
  }

  getAmount(amount: number) {
    return this.amountPipe.transform(Math.abs(amount), this.digits);
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

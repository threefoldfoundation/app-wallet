import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ToastController, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CopyEventData, ExplorerBlock, LOCKTIME_BLOCK_LIMIT, PendingTransaction } from '../../interfaces';
import { AmountPipe } from '../../pipes';
import { getLatestBlock, IAppState } from '../../state';
import { filterNull, getLocked } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'pending-transaction-detail.component.html'
})
export class PendingTransactionDetailPageComponent implements OnInit {
  transaction: PendingTransaction;
  latestBlock$: Observable<ExplorerBlock>;
  lockedTokens$: Observable<string[]>;

  constructor(private params: NavParams,
              private translate: TranslateService,
              private amountPipe: AmountPipe,
              private viewCtrl: ViewController,
              private toastCtrl: ToastController,
              private datePipe: DatePipe,
              private store: Store<IAppState>) {
  }

  ngOnInit() {
    this.transaction = this.params.get('transaction');
    this.latestBlock$ = this.store.pipe(select(getLatestBlock), filterNull());
    this.lockedTokens$ = this.latestBlock$.pipe(map(block => getLocked(this.transaction, block).map(locked => {
      let unlocktime;
      let key;
      if (locked.unlocktime < LOCKTIME_BLOCK_LIMIT) {
        key = 'x_currency_locked_until_block_y';
        unlocktime = locked.unlocktime;
      } else {
        key = 'x_currency_locked_until_y';
        unlocktime = this.datePipe.transform(locked.date, 'medium');
      }
      return this.translate.instant(key, { amount: this.amountPipe.transform(locked.value), unlocktime });
    })));
  }

  getAmount(amount: number) {
    return this.amountPipe.transform(Math.abs(amount));
  }

  showCopiedToast(result: CopyEventData) {
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

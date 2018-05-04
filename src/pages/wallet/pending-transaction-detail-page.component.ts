import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ToastController, ViewController } from 'ionic-angular';
import { CopyEventData, LOCKTIME_BLOCK_LIMIT, PendingTransaction } from '../../interfaces';
import { AmountPipe } from '../../pipes';
import { getLocked } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'pending-transaction-detail.component.html'
})
export class PendingTransactionDetailPageComponent implements OnInit {
  transaction: PendingTransaction;

  constructor(private params: NavParams,
              private translate: TranslateService,
              private amountPipe: AmountPipe,
              private viewCtrl: ViewController,
              private toastCtrl: ToastController,
              private datePipe: DatePipe) {
  }

  ngOnInit() {
    this.transaction = this.params.get('transaction');
  }

  getAmount(amount: number) {
    return this.amountPipe.transform(Math.abs(amount));
  }

  getLocked() {
    return getLocked(this.transaction).map(locked => {
      let unlocktime;
      let key;
      if (locked.value < LOCKTIME_BLOCK_LIMIT) {
        key = 'x_currency_locked_until_block_y';
        unlocktime = locked.unlocktime;
      } else {
        key = 'x_currency_locked_until_y';
        unlocktime = this.datePipe.transform(locked.date, 'medium');
      }
      return this.translate.instant(key, { amount: this.amountPipe.transform(locked.value), unlocktime });
    });
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

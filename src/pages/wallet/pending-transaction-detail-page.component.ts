import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ToastController, ViewController } from 'ionic-angular';
import { COIN_TO_HASTINGS_PRECISION, CopyEventData, PendingTransaction } from '../../interfaces';
import { AmountPipe } from '../../pipes';
import { getLocked } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'pending-transaction-detail.component.html'
})
export class PendingTransactionDetailPageComponent implements OnInit {
  transaction: PendingTransaction;
  digits = `1.0-${COIN_TO_HASTINGS_PRECISION}`;
  getLocked = getLocked;

  constructor(private params: NavParams,
              private translate: TranslateService,
              private amountPipe: AmountPipe,
              private viewCtrl: ViewController,
              private toastCtrl: ToastController) {
  }

  ngOnInit() {
    this.transaction = this.params.get('transaction');
  }

  getAmount(amount: number) {
    return this.amountPipe.transform(Math.abs(amount), this.digits);
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

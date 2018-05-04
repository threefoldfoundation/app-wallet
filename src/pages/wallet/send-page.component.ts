import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, ModalController } from 'ionic-angular';
import { CryptoAddress, QrCodeScannedContent } from 'rogerthat-plugin';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { GetAddresssAction, GetTransactionsAction, ScanQrCodeAction } from '../../actions';
import {
  ADDRESS_LENGTH,
  CreateSignatureData,
  CreateTransactionResult,
  CURRENCY_SYMBOL,
  KEY_NAME,
  RIVINE_ALGORITHM,
} from '../../interfaces';
import { getAddress, getQrCodeContent, getTransactionsStatus, IAppState } from '../../state';
import { filterNull, isUnrecognizedHashError, parseQuery } from '../../util';
import { ConfirmSendPageComponent } from './confirm-send-page.component';

const PRECISION = 5;
const DEFAULT_FORM_DATA = {
  amount: 0,
  precision: PRECISION,
  from_address: '',
  to_address: '',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ion-content>
      <send [hasTransactions]="hasTransactions$ | async"
            [data]="data"
            [address]="address$ | async"
            [addressLength]="addressLength"
            (scanQr)="onScanQr()"
            (createSignatureData)="onCreateSignatureData($event)"></send>
    </ion-content>`,
})
export class SendPageComponent implements OnInit, OnDestroy {
  hasTransactions$: Observable<boolean>;
  address$: Observable<CryptoAddress>;
  addressLength = ADDRESS_LENGTH;
  data: CreateSignatureData = DEFAULT_FORM_DATA; // cant get it to work with a subject

  private _qrCodeContentSubscription: Subscription;

  constructor(private store: Store<IAppState>,
              private modalCtrl: ModalController,
              private alertCtrl: AlertController,
              private translate: TranslateService,
              private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.hasTransactions$ = this.store.pipe(
      select(getTransactionsStatus),
      map(s => s.error === null || !isUnrecognizedHashError(s.error.error)));
    this.store.dispatch(new GetAddresssAction({
      algorithm: RIVINE_ALGORITHM,
      index: 0,
      keyName: KEY_NAME,
      message: this.translate.instant('please_enter_your_pin'),
    }));
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this._qrCodeContentSubscription = this.store.pipe(
      select(getQrCodeContent),
      filterNull(),
      filter(r => r.status === 'resolved'),
    ).subscribe((result: QrCodeScannedContent) => {
      const parsedQr = this.parseQr(result.content);
      if (parsedQr.token === CURRENCY_SYMBOL && parsedQr.address) {
        this.setData({ ...this.data, amount: parsedQr.amount, to_address: parsedQr.address });
      } else {
        this.alertCtrl.create({
          message: this.translate.instant('unknown_qr_code_scanned'),
          buttons: [{ text: this.translate.instant('ok') }],
        }).present();
      }
    });
  }

  ngOnDestroy() {
    this._qrCodeContentSubscription.unsubscribe();
  }

  parseQr(qr: string) {
    let token = CURRENCY_SYMBOL;
    let address = null;
    const [url, qry] = qr.split('?');
    const amount = parseFloat(parseQuery(qry || '').amount) || 0;
    const splitUrl = url.split(':');
    for (const part of splitUrl) {
      if (part.length === 3) {
        token = part.toUpperCase();
      }
      if (part.length === ADDRESS_LENGTH) {
        address = part;
      }
    }
    return { token, address, amount };
  }

  onCreateSignatureData(data: CreateSignatureData) {
    const modal = this.modalCtrl.create(ConfirmSendPageComponent, {
      transactionData: {
        ...data,
        amount: Math.round(data.amount * Math.pow(10, PRECISION)),
      },
    });
    modal.onDidDismiss((transaction: CreateTransactionResult | null) => {
      if (transaction) {
        const config = {
          title: this.translate.instant('transaction_complete'),
          message: this.translate.instant('transaction_complete_message'),
          buttons: [{ text: this.translate.instant('ok') }],
        };
        const alert = this.alertCtrl.create(config);
        alert.present();
        alert.onDidDismiss(() => {
          this.store.dispatch(new GetTransactionsAction(data.from_address));
        });
        this.setData(DEFAULT_FORM_DATA);
      }
    });
    modal.present();
  }

  setData(data: CreateSignatureData) {
    this.data = data;
    this.cdRef.detectChanges();
  }

  onScanQr() {
    this.store.dispatch(new ScanQrCodeAction('front'));
  }
}

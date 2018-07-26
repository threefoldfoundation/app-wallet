import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, ModalController } from 'ionic-angular';
import { CryptoAddress, KeyPair, QrCodeScannedContent } from 'rogerthat-plugin';
import { Observable, Subscription } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { GetAddresssAction, GetHashInfoAction, ScanQrCodeAction } from '../../actions';
import { Provider } from '../../configuration';
import { CreateSignatureData, CreateTransactionResult } from '../../interfaces';
import { getAddress, getKeyPairProvider, getQrCodeContent, getSelectedKeyPair, getTransactions, IAppState } from '../../state';
import { filterNull, parseQuery } from '../../util';
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
            [addressLength]="addressLength$ | async"
            (scanQr)="onScanQr()"
            (createSignatureData)="onCreateSignatureData($event)"></send>
    </ion-content>`,
})
export class SendPageComponent implements OnInit, OnDestroy {
  hasTransactions$: Observable<boolean>;
  keyPair$: Observable<KeyPair>;
  address$: Observable<CryptoAddress>;
  currentProvider$: Observable<Provider>;
  addressLength$: Observable<number>;
  data: CreateSignatureData = DEFAULT_FORM_DATA; // cant get it to work with a subject

  private _qrCodeContentSubscription: Subscription;
  private _keyPairSubscription: Subscription;

  constructor(private store: Store<IAppState>,
              private modalCtrl: ModalController,
              private alertCtrl: AlertController,
              private translate: TranslateService,
              private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.hasTransactions$ = this.store.pipe(
      select(getTransactions),
      map(transactions => transactions.length > 0));

    this.keyPair$ = this.store.pipe(select(getSelectedKeyPair), filterNull());
    this.currentProvider$ = this.store.pipe(select(getKeyPairProvider), filterNull());
    this.addressLength$ = this.currentProvider$.pipe(map(p => p.addressLength));
    this._keyPairSubscription = this.keyPair$.subscribe(keyPair =>
      this.store.dispatch(new GetAddresssAction({
        algorithm: keyPair.algorithm,
        index: 0,
        keyName: keyPair.name,
        message: this.translate.instant('please_enter_your_pin'),
      })));
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this._qrCodeContentSubscription = this.store.pipe(
      select(getQrCodeContent),
      filterNull(),
      filter(r => r.status === 'resolved'),
      withLatestFrom(this.currentProvider$),
    ).subscribe(([ result, provider ]: [ QrCodeScannedContent, Provider ]) => {
      const parsedQr = this.parseQr(result.content, provider.symbol, provider.addressLength);
      if (parsedQr.token === provider.symbol && parsedQr.address) {
        this.setData({ ...this.data, amount: parsedQr.amount, to_address: parsedQr.address });
      } else {
        this.alertCtrl.create({
          message: this.translate.instant('unknown_qr_code_scanned'),
          buttons: [ { text: this.translate.instant('ok') } ],
        }).present();
      }
    });
  }

  ngOnDestroy() {
    this._qrCodeContentSubscription.unsubscribe();
    this._keyPairSubscription.unsubscribe();
  }

  parseQr(qr: string, symbol: string, addressLength: number) {
    let token = symbol;
    let address = null;
    const [ url, qry ] = qr.split('?');
    const amount = parseFloat(parseQuery(qry || '').amount) || 0;
    const splitUrl = url.split(':');
    for (const part of splitUrl) {
      if (part.length === 3) {
        token = part.toUpperCase();
      }
      if (part.length === addressLength) {
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
          buttons: [ { text: this.translate.instant('ok') } ],
        };
        const alert = this.alertCtrl.create(config);
        alert.present();
        alert.onDidDismiss(() => {
          this.store.dispatch(new GetHashInfoAction(data.from_address));
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

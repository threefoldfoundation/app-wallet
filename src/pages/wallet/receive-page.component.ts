import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, ModalController, ToastController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { first, map, startWith, withLatestFrom } from 'rxjs/operators';
import {
  COIN_TO_HASTINGS_PRECISION,
  CreateTransactionResult,
  ExplorerHashERC20Info,
  SUPPORTED_TOKENS,
  TransactionVersion
} from '../../interfaces/wallet';
import { getAddress, getErc20Info, getKeyPairProvider, IAppState } from '../../state';
import { filterNull } from '../../util';
import { ConfirmSendPageComponent } from './confirm-send-page.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'receive-page.component.html',
  styles: [ `.address-line {
    max-width: 100%;
  }` ],
})
export class ReceivePageComponent implements OnInit {
  @ViewChild('address') address: ElementRef;
  amountControl: FormControl;
  address$: Observable<string>;
  qrContent$: Observable<string>;
  erc20Info$: Observable<ExplorerHashERC20Info | null>;
  version: TransactionVersion = TransactionVersion.ONE;
  versions = SUPPORTED_TOKENS;

  constructor(private store: Store<IAppState>,
              private translate: TranslateService,
              private toastCtrl: ToastController,
              private alertCtrl: AlertController,
              private modalCtrl: ModalController) {
    this.amountControl = new FormControl();
  }

  ngOnInit() {
    this.address$ = this.store.pipe(
      select(getAddress),
      filterNull(),
      map(address => address.address),
    );
    this.erc20Info$ = this.store.pipe(select(getErc20Info));
    this.qrContent$ = this.amountControl.valueChanges.pipe(
      startWith(''),
      withLatestFrom(this.address$, this.store.pipe(select(getKeyPairProvider), filterNull())),
      map(([ amount, address, provider ]) => `${provider.symbol}:${address}?amount=${parseFloat(amount) || 0}`),
    );
  }

  showCopiedToast(event: { isSuccess: boolean }) {
    if (event.isSuccess) {
      this.toastCtrl.create({
        message: this.translate.instant('address_copied_to_clipboard'),
        duration: 3000,
        position: 'bottom',
        showCloseButton: true,
        closeButtonText: this.translate.instant('ok'),
      }).present();
    }
  }

  registerWithdrawAddress() {
    this.address$.pipe(first()).subscribe(address => {
      const transactionData = {
        amount: 0,
        to_address: '',
        from_address: address,
        version: TransactionVersion.ERC20AddressRegistration,
        precision: COIN_TO_HASTINGS_PRECISION
      };
      const modal = this.modalCtrl.create(ConfirmSendPageComponent, { transactionData });
      modal.onDidDismiss((transaction: CreateTransactionResult | null) => {
        if (transaction) {
          const config = {
            title: this.translate.instant('erc_address_registration_complete'),
            message: this.translate.instant('erc_address_registration_complete_message'),
            buttons: [{ text: this.translate.instant('ok') }],
          };
          const alert = this.alertCtrl.create(config);
          alert.present();
          alert.onDidDismiss(() => {
            // guess we're done
          });
        }
      });
      modal.present();
    });
  }
}

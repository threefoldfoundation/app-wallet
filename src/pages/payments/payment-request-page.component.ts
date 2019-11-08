import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams, Platform } from 'ionic-angular';
import {
  CreatePaymentRequestContext,
  CryptoAddress,
  MessageEmbeddedApp,
  PaymentRequestContext,
  PaymentRequestData
} from 'rogerthat-plugin';
import { Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { GetAddresssAction } from '../../actions';
import { CreateSignatureData, CreateTransactionResult, TransactionVersion } from '../../interfaces';
import { getAddress, getSelectedKeyPair, IAppState } from '../../state';
import { filterNull } from '../../util';
import { ConfirmSendPageComponent } from '../wallet';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './payment-request-page.component.html'
})
export class PaymentRequestPageComponent implements OnInit, OnDestroy {
  paymentRequest: PaymentRequestData;
  address$: Observable<CryptoAddress>;
  private _embeddedApp: MessageEmbeddedApp;
  private _payContext: PaymentRequestContext;
  private _keyPairSubscription: Subscription;

  constructor(private store: Store<IAppState>,
              private navParams: NavParams,
              private navController: NavController,
              private translate: TranslateService,
              private modalController: ModalController,
              private actions$: Actions,
              private platform: Platform,
              private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    const payContext: PaymentRequestContext = this.navParams.get('payContext');
    this._payContext = payContext;
    this._keyPairSubscription = this.store.pipe(select(getSelectedKeyPair), filterNull()).subscribe(keyPair => {
      this.store.dispatch(new GetAddresssAction({
        algorithm: keyPair.algorithm,
        index: 0,
        keyName: keyPair.name,
        message: this.translate.instant('please_enter_your_pin'),
      }));
    });
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this.address$.pipe(first()).subscribe(address => {
      this.paymentRequest = JSON.parse(payContext.data.context).data;
      if (address.address === this.paymentRequest.to) {
        // TODO check if current user is 'sender'. If so, show a different page (perhaps same page as 'sent' but with disabled buttons)
      }
      this._embeddedApp = payContext.data;
      this.cdRef.markForCheck();
    });
  }

  ngOnDestroy() {
    this._keyPairSubscription.unsubscribe();
  }

  close() {
    if (this._payContext.data.result) {
      this.platform.exitApp();
    } else {
      this.exitWithResult({
        success: false,
        code: 'canceled',
        message: this.translate.instant('the_transaction_has_been_canceled'),
      });
    }
  }

  /**
   * Shows the confirmation page in a modal. When confirmed, exit the app with the updated (embeddedApp) result.
   */
  submitPayment() {
    const parsedContext: CreatePaymentRequestContext = JSON.parse(this._embeddedApp.context);
    this.store.pipe(select(getAddress), first()).subscribe(address => {
      if (address) {
        const transactionData: CreateSignatureData = {
          version: TransactionVersion.ONE,
          amount: parsedContext.data.amount,
          from_address: address.address,
          to_address: parsedContext.data.to,
          precision: parsedContext.data.precision
        };
        const modal = this.modalController.create(ConfirmSendPageComponent, { transactionData });
        modal.onDidDismiss((createdTransactionResult: CreateTransactionResult | null) => {
          // todo success icon
          if (createdTransactionResult) {
            const successIcon = 'http://www.myiconfinder.com/uploads/iconsets/256-256-c0829a49b2acd49adeab380f70eb680a-accept.png';
            const modifiedResult = {
              ...this._embeddedApp,
              result: JSON.stringify(createdTransactionResult),
              image_url: successIcon,
            };
            this.exitWithResult(modifiedResult);
          }
        });
        modal.present();
      }
    });
  }

  private exitWithResult(result: any) {
    rogerthat.app.exitWithResult(JSON.stringify(result));
  }
}

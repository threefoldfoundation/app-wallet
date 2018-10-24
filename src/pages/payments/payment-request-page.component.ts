import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Actions } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams, Platform } from 'ionic-angular';
import { CreatePaymentRequestContext, CryptoAddress, PaymentRequestContext, RogerthatError } from 'rogerthat-plugin';
import { MessageEmbeddedApp, PaymentRequestData } from 'rogerthat-plugin/www/rogerthat-payment';
import { Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { GetAddresssAction } from '../../actions';
import { ApiRequestStatus, CreateSignatureData, CreateTransactionResult } from '../../interfaces';
import { AmountPipe } from '../../pipes';
import { getAddress, getAddressStatus, getSelectedKeyPair, IAppState } from '../../state';
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
  addressStatus$: Observable<ApiRequestStatus<RogerthatError>>;
  isOwnRequest$: Observable<boolean>;
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
              private cdRef: ChangeDetectorRef,
              private amountPipe: AmountPipe) {
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
    this.addressStatus$ = this.store.pipe(select(getAddressStatus));
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this.isOwnRequest$ = this.address$.pipe(map(address => {
      this.paymentRequest = JSON.parse(payContext.data.context).data;
      this._embeddedApp = payContext.data;
      this.cdRef.markForCheck();
      return address.address === this.paymentRequest.to;
    }));
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
  submitPayment(form: NgForm) {
    if (!form.form.valid) {
      return;
    }
    const parsedContext: CreatePaymentRequestContext = JSON.parse(this._embeddedApp.context);
    this.store.pipe(select(getAddress), first()).subscribe(address => {
      if (address) {
        const transactionData: CreateSignatureData = {
          amount: parsedContext.data.amount,
          from_address: address.address,
          to_address: parsedContext.data.to,
          precision: parsedContext.data.precision
        };
        const modal = this.modalController.create(ConfirmSendPageComponent, { transactionData });
        modal.onDidDismiss((createdTransactionResult: CreateTransactionResult | null) => {
          if (createdTransactionResult) {
            const successIcon = 'https://storage.googleapis.com/rogerthat-server.appspot.com/embedded-app-assets/green-checkmark.png';
            const title= this.translate.instant('completed_payment_of_x', { amount: this.amountPipe.transform(parsedContext.data.amount) });
            const modifiedResult = {
              ...this._embeddedApp,
              result: JSON.stringify(createdTransactionResult),
              title,
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

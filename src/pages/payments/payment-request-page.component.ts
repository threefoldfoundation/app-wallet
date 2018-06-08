import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams, Platform } from 'ionic-angular';
import { CreatePaymentRequestContext, CryptoAddress, PaymentRequestContext, RogerthatError } from 'rogerthat-plugin';
import { MessageEmbeddedApp, PaymentRequestData } from 'rogerthat-plugin/www/rogerthat-payment';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { GetAddresssAction, GetTransactionAction, GetTransactionCompleteAction, WalletActionTypes } from '../../actions';
import { ApiRequestStatus, CreateSignatureData, CreateTransactionResult, KEY_NAME, RIVINE_ALGORITHM, } from '../../interfaces';
import { getAddress, getAddressStatus, IAppState } from '../../state';
import { filterNull, isPendingTransaction } from '../../util';
import { ConfirmSendPageComponent, PendingTransactionDetailPageComponent, TransactionDetailPageComponent } from '../wallet';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './payment-request-page.component.html'
})
export class PaymentRequestPageComponent implements OnInit {
  paymentRequest: PaymentRequestData;
  address$: Observable<CryptoAddress>;
  addressStatus$: Observable<ApiRequestStatus<RogerthatError>>;
  private _embeddedApp: MessageEmbeddedApp;
  private _payContext: PaymentRequestContext;

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
    this.store.dispatch(new GetAddresssAction({
      algorithm: RIVINE_ALGORITHM,
      index: 0,
      keyName: KEY_NAME,
      message: this.translate.instant('please_enter_your_pin'),
    }));
    this.addressStatus$ = this.store.pipe(select(getAddressStatus));
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this.actions$.pipe(ofType<GetTransactionCompleteAction>(WalletActionTypes.GET_TRANSACTION_COMPLETE)).subscribe(action => {
      const modal = this.modalController.create(TransactionDetailPageComponent, { transaction: action.payload });
      modal.onDidDismiss(() => this.close());
      modal.present();
    });
    if (payContext.data.result) {
    // todo show loading spinner on current page, then replace current page with new page
      this.showTransaction(JSON.parse(payContext.data.result));
    } else {
      // TODO check if current user is 'sender'. If so, show a different page (perhaps same page as 'sent' but with disabled buttons)
      this.showPayPage(payContext.data);
    }
  }

  showPayPage(context: MessageEmbeddedApp) {
    this.paymentRequest = JSON.parse(context.context).data;
    this._embeddedApp = context;
    this.cdRef.markForCheck();
  }

  showTransaction(result: CreateTransactionResult) {
    this.address$.pipe(first()).subscribe(address => this.store.dispatch(new GetTransactionAction(result.transactionid, address.address)));
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

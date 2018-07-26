import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavParams } from 'ionic-angular';
import { CreateTransactionBaseResult, PayWidgetData, RogerthatError } from 'rogerthat-plugin';
import { PaymentMethod } from 'rogerthat-plugin/www/rogerthat-payment';
import { Observable, Subscription } from 'rxjs';
import { GetAddresssAction } from '../../actions';
import { ApiRequestStatus, CreateSignatureData, CreateTransactionResult } from '../../interfaces';
import { getAddress, getAddressStatus, getKeyPairProvider, getSelectedKeyPair, IAppState } from '../../state';
import { filterNull } from '../../util';
import { ConfirmSendPageComponent } from './confirm-send-page.component';

@Component({
  selector: 'pay-widget-page-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'pay-widget-page.component.html',
})
export class PayWidgetPageComponent implements OnInit, OnDestroy {
  addressStatus$: Observable<ApiRequestStatus<RogerthatError>>;
  selectedMethod: PaymentMethod;
  private _addressSubscription: Subscription = Subscription.EMPTY;
  private _keyPairSubscription: Subscription;

  constructor(private store: Store<IAppState>,
              private navParams: NavParams,
              private translate: TranslateService,
              private modalCtrl: ModalController) {
  }

  ngOnInit() {
    const payContext: PayWidgetData = this.navParams.get('payContext');
    this.store.pipe(select(getKeyPairProvider), filterNull()).subscribe(provider => {
      const method = payContext.methods.find(m => m.provider_id === provider.providerId);
      // TODO filter wallets on wallet chooser page so that this never happens
      if (!this.selectedMethod) {
        this.exitWithError({
          code: 'provider_not_supported',
          message: `Provider ${payContext.methods[ 0 ].provider_id} is not supported`,
        });
        return;
      }
      this.selectedMethod = <PaymentMethod>method;
      this._addressSubscription = this.store.pipe(select(getAddress)).subscribe(address => {
        if (address) {
          const data: CreateSignatureData = {
            amount: this.selectedMethod.amount,
            precision: this.selectedMethod.precision,
            to_address: this.selectedMethod.target,  // target is our destination address
            from_address: address.address,
          };
          this.showConfirmDialog(data);
        }
      });
    });
    this._keyPairSubscription = this.store.pipe(select(getSelectedKeyPair), filterNull()).subscribe(keyPair =>
      this.store.dispatch(new GetAddresssAction({
        algorithm: keyPair.algorithm,
        index: 0,
        keyName: keyPair.name,
        message: this.translate.instant('please_enter_your_pin'),
      })),
    );
    this.addressStatus$ = this.store.pipe(select(getAddressStatus));
  }

  ngOnDestroy() {
    this._addressSubscription.unsubscribe();
    this._keyPairSubscription.unsubscribe();
  }

  showConfirmDialog(transactionData: CreateSignatureData) {
    const modal = this.modalCtrl.create(ConfirmSendPageComponent, { transactionData });
    modal.onDidDismiss((transaction: CreateTransactionResult | null) => {
      if (transaction) {
        const result: CreateTransactionBaseResult = {
          success: true,
          provider_id: this.selectedMethod.provider_id,
          status: 'pending',
          transaction_id: transaction.transactionid,
        };
        this.exitWithResult(result);
      } else {
        this.close();
      }
    });
    modal.present();
  }

  close() {
    this.exitWithResult({
      success: false,
      code: 'canceled',
      message: this.translate.instant('the_transaction_has_been_canceled'),
    });
  }

  private exitWithResult(result: any) {
    rogerthat.app.exitWithResult(JSON.stringify(result));
  }

  private exitWithError(error: RogerthatError) {
    const exitResult = {
      code: error.code,
      message: error.message,
      success: false,
    };
    this.exitWithResult(exitResult);
  }
}

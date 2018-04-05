import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { GetAddresssAction } from '../../actions';
import {
  ApiRequestStatus,
  CreateSignatureData,
  KEY_NAME,
  PROVIDER_ID,
  RIVINE_ALGORITHM,
  RivineCreateTransactionResult,
} from '../../interfaces';
import { CreateTransactionBaseResult, PayWidgetData } from '../../manual_typings/rogerthat';
import { RogerthatError } from '../../manual_typings/rogerthat-errors';
import { getAddress, getAddressStatus, IAppState } from '../../state';
import { ConfirmSendPageComponent } from './confirm-send-page.component';

@Component({
  selector: 'pay-widget-page-component',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'pay-widget-page.component.html',
})
export class PayWidgetPageComponent implements OnInit, OnDestroy {
  addressStatus$: Observable<ApiRequestStatus<RogerthatError>>;
  private _addressSubscription: Subscription;

  constructor(private store: Store<IAppState>,
              private navParams: NavParams,
              private translate: TranslateService,
              private modalCtrl: ModalController) {
  }

  ngOnInit() {
    const payContext: PayWidgetData = this.navParams.get('payContext');
    const threefoldMethod = payContext.methods.find(m => m.provider_id === PROVIDER_ID);
    if (!threefoldMethod) {
      this.exitWithError({
        code: 'provider_not_supported',
        message: `Provider ${payContext.methods[0].provider_id} is not supported`,
      });
      return;
    }
    this.store.dispatch(new GetAddresssAction({
      algorithm: RIVINE_ALGORITHM,
      index: 0,
      keyName: KEY_NAME,
      message: this.translate.instant('please_enter_your_pin'),
    }));
    this._addressSubscription = this.store.pipe(select(getAddress)).subscribe(address => {
      if (address) {
        const data: CreateSignatureData = {
          amount: threefoldMethod.amount,
          precision: threefoldMethod.precision,
          to_address: payContext.target,  // target is our destination address
          from_address: address.address,
        };
        this.showConfirmDialog(data);
      }
    });
    this.addressStatus$ = this.store.pipe(select(getAddressStatus));
  }

  ngOnDestroy() {
    this._addressSubscription.unsubscribe();
  }

  showConfirmDialog(transactionData: CreateSignatureData) {
    const modal = this.modalCtrl.create(ConfirmSendPageComponent, {transactionData});
    modal.onDidDismiss((transaction: RivineCreateTransactionResult | null) => {
      if (transaction) {
        const result: CreateTransactionBaseResult = {
          success: true,
          provider_id: PROVIDER_ID,
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

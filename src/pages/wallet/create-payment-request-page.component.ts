import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, NgForm, Validators } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { MessageEmbeddedApp } from 'rogerthat-plugin';
import { Subscription } from 'rxjs';
import { GetAddresssAction } from '../../actions';
import { configuration } from '../../configuration';
import {
  COIN_TO_HASTINGS_PRECISION,
  ContextDataType,
  CURRENCY_SYMBOL,
  KEY_NAME,
  MessageContextData,
  PaymentRequestData,
  RIVINE_ALGORITHM
} from '../../interfaces';
import { getAddress, IAppState } from '../../state';
import { filterNull } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'create-payment-request-page.component.html'
})
export class CreatePaymentRequestPageComponent implements OnInit {
  request: PaymentRequestData;
  amountControl: FormControl;

  private _addressSub: Subscription;

  constructor(private translate: TranslateService, private store: Store<IAppState>) {
    this.amountControl = new FormControl(0, [Validators.required, Validators.min(0.01)]);
    this.request = {
      amount: this.amountControl.value,
      currency: CURRENCY_SYMBOL,
      precision: COIN_TO_HASTINGS_PRECISION,
      test_mode: !configuration.production,
      to: '',
      memo: '',
    };
  }

  ngOnInit() {
    this.store.dispatch(new GetAddresssAction({
      algorithm: RIVINE_ALGORITHM,
      index: 0,
      keyName: KEY_NAME,
      message: this.translate.instant('please_enter_your_pin'),
    }));
    this._addressSub = this.store.pipe(select(getAddress), filterNull()).subscribe(address => this.request.to = address.address);
  }

  close() {
    this.exitWithResult({
      success: false,
      code: 'canceled',
      message: this.translate.instant('payment_request_canceled'),
    });
  }

  private exitWithResult(result: any) {
    rogerthat.app.exitWithResult(JSON.stringify(result));
  }

  submit(form: NgForm) {
    if (form.form.valid) {
      const context: MessageContextData = {
          type: ContextDataType.PAYMENT_REQUEST,
          data: { ...this.request, amount: this.amountControl.value * Math.pow(10, this.request.precision) }
      };
      const messageEmbeddedApp: MessageEmbeddedApp = {
        context: JSON.stringify(context),
        title: this.translate.instant(`Payment to ${rogerthat.user.name}`),
        description: this.request.memo,
      };
      this.exitWithResult(messageEmbeddedApp);
    }
  }
}

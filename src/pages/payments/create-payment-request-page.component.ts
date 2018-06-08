import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, NgForm, Validators } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { MessageEmbeddedApp, PaymentRequestData } from 'rogerthat-plugin';
import { CreatePaymentRequestContext, RogerthatContextType } from 'rogerthat-plugin/www/rogerthat-payment';
import { first } from 'rxjs/operators';
import { GetAddresssAction } from '../../actions';
import { configuration } from '../../configuration';
import { COIN_TO_HASTINGS_PRECISION, CURRENCY_SYMBOL, KEY_NAME, RIVINE_ALGORITHM } from '../../interfaces/index';
import { getAddress, IAppState } from '../../state';
import { filterNull } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'create-payment-request-page.component.html'
})
export class CreatePaymentRequestPageComponent implements OnInit {
  request: PaymentRequestData;
  amountControl: FormControl;

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
      this.store.pipe(select(getAddress), filterNull(), first()).subscribe(address => {
        const context: CreatePaymentRequestContext = {
          type: RogerthatContextType.CREATE_PAYMENT_REQUEST,
          data: {
            ...this.request,
            amount: this.amountControl.value * Math.pow(10, this.request.precision),
            to: address.address
          },
        };
        const messageEmbeddedApp: MessageEmbeddedApp = {
          context: JSON.stringify(context),
          title: this.translate.instant(`Payment to ${rogerthat.user.name}`),
          description: this.request.memo,
        };
        this.exitWithResult(messageEmbeddedApp);
      });
    }
  }
}

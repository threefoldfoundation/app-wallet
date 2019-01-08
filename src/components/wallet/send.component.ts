import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CryptoAddress } from 'rogerthat-plugin';
import { CreateSignatureData, ERC20_ADDRESS_LENGTH, SUPPORTED_TOKENS, TransactionVersion } from '../../interfaces';

@Component({
  selector: 'send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'send.component.html',
})
export class SendComponent {
  @Input() hasTransactions: boolean;
  @Input() address: CryptoAddress;
  @Input() addressLength: number;

  @Input() set data(value: CreateSignatureData) {
    this._data = { ...value };
  }

  get data() {
    return this._data;
  }

  get addressLengthValidation() {
    if (this.data.version === TransactionVersion.ERC20Conversion) {
      return ERC20_ADDRESS_LENGTH;
    }
    return this.addressLength;
  }

  @Output() createSignatureData = new EventEmitter<CreateSignatureData>();
  @Output() scanQr = new EventEmitter();

  private _data: CreateSignatureData;

  versions = SUPPORTED_TOKENS;

  submitForm(form: NgForm) {
    if (!form.form.valid) {
      return;
    }
    this.createSignatureData.emit({ ...this.data, from_address: this.address.address });
  }
}

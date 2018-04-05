import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CreateSignatureData } from '../../interfaces/wallet';
import { CryptoAddress } from '../../manual_typings/rogerthat';

@Component({
  selector: 'send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'send.component.html',
})
export class SendComponent {
  @Input() address: CryptoAddress;
  @Input() addressLength: number;

  @Input() set data(value: CreateSignatureData) {
    this._data = { ...value };
  }

  get data() {
    return this._data;
  }

  @Output() createSignatureData = new EventEmitter<CreateSignatureData>();
  @Output() scanQr = new EventEmitter();

  private _data: CreateSignatureData;

  submitForm(form: NgForm) {
    if (!form.form.valid) {
      return;
    }
    this.createSignatureData.emit({ ...this.data, from_address: this.address.address });
  }
}

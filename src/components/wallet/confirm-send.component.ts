import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiRequestStatus } from '../../interfaces';
import { CryptoTransaction, CryptoTransactionData } from '../../manual_typings/rogerthat';
import { getTransactionAmount } from '../../util/wallet';

@Component({
  selector: 'confirm-send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'confirm-send.component.html',
})
export class ConfirmSendComponent {
  @Input() transaction: CryptoTransaction;
  @Input() pendingStatus: ApiRequestStatus;
  @Input() createStatus: ApiRequestStatus;
  @Output() confirmTransaction = new EventEmitter();

  getAmount(transaction: CryptoTransaction): number {
    console.log(transaction);
    return transaction.data
      .reduce((total: number, data: CryptoTransactionData) => total + getTransactionAmount(transaction.to_address, [], data.outputs), 0);
  }

  getTotalAmount(transaction: CryptoTransaction): number {
    return this.getAmount(transaction) + parseInt(transaction.minerfees);
  }

  submit() {
    this.confirmTransaction.emit();
  }
}

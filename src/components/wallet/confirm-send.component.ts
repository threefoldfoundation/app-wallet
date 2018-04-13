import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CryptoTransaction, CryptoTransactionData } from 'rogerthat-plugin';
import { ApiRequestStatus } from '../../interfaces';
import { getv0TransactionAmount } from '../../util/wallet';

@Component({
  selector: 'confirm-send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'confirm-send.component.html',
})
export class ConfirmSendComponent {
  @Input() transaction: CryptoTransaction;
  @Input() pendingStatus: ApiRequestStatus;
  @Input() createStatus: ApiRequestStatus;
  @Output() confirmTransaction = new EventEmitter();

  getAmount(transaction: CryptoTransaction): number {
    return transaction.data
      .reduce((total: number, data: CryptoTransactionData) => total + getv0TransactionAmount(transaction.to_address, [], data.outputs), 0);
  }

  getTotalAmount(transaction: CryptoTransaction): number {
    return this.getAmount(transaction) + parseInt(transaction.minerfees);
  }

  submit() {
    this.confirmTransaction.emit();
  }
}

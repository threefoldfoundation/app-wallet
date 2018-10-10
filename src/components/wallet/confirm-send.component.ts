import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CryptoAddress } from 'rogerthat-plugin';
import { ApiRequestStatus, Transaction1 } from '../../interfaces';
import { calculateNewTransactionAmount, getMinerFee } from '../../util';

@Component({
  selector: 'confirm-send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'confirm-send.component.html',
})
export class ConfirmSendComponent {
  @Input() transaction: Transaction1;
  @Input() pendingStatus: ApiRequestStatus;
  @Input() createStatus: ApiRequestStatus;
  @Input() ownAddress: CryptoAddress;
  @Output() confirmTransaction = new EventEmitter();
  getMinerFee = getMinerFee;

  getAmount(transaction: Transaction1) {
    return calculateNewTransactionAmount(transaction, this.ownAddress.address);
  }

  getTotalAmount(transaction: Transaction1): number {
    return this.getAmount(transaction) + getMinerFee(this.transaction.data.minerfees);
  }

  submit() {
    this.confirmTransaction.emit();
  }
}

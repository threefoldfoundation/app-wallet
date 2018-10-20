import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { CryptoAddress } from 'rogerthat-plugin';
import { ApiRequestStatus, CoinOutput1, Transaction1 } from '../../interfaces';
import { calculateNewTransactionAmount, getMinerFee, getNewTransactionOtherOutputs } from '../../util';

@Component({
  selector: 'confirm-send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'confirm-send.component.html',
})
export class ConfirmSendComponent implements OnChanges {
  @Input() transaction: Transaction1;
  @Input() pendingStatus: ApiRequestStatus;
  @Input() createStatus: ApiRequestStatus;
  @Input() ownAddress: CryptoAddress;
  @Output() confirmTransaction = new EventEmitter();
  getMinerFee = getMinerFee;
  visibleOutputs: CoinOutput1[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (this.transaction && this.ownAddress) {
      this.visibleOutputs = getNewTransactionOtherOutputs(this.transaction, this.ownAddress.address);
    }
  }

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

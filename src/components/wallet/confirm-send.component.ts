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
import { ApiRequestStatus, CoinOutput1, CreateTransactionType, TransactionVersion } from '../../interfaces';
import { calculateNewTransactionAmount, getFee, getNewTransactionOtherOutputs } from '../../util';

@Component({
  selector: 'confirm-send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'confirm-send.component.html',
})
export class ConfirmSendComponent implements OnChanges {
  @Input() transaction: CreateTransactionType;
  @Input() pendingStatus: ApiRequestStatus;
  @Input() createStatus: ApiRequestStatus;
  @Input() ownAddress: CryptoAddress;
  @Output() confirmTransaction = new EventEmitter();
  visibleOutputs: CoinOutput1[] = [];
  showAddressRegistrationInfo = false;
  fee = 0;
  amount = 0;
  totalAmount = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (this.transaction && this.ownAddress) {
      this.fee = getFee(this.transaction);
      this.amount = calculateNewTransactionAmount(this.transaction, this.ownAddress.address);
      this.totalAmount = this.amount + this.fee;
      this.visibleOutputs = getNewTransactionOtherOutputs(this.transaction, this.ownAddress.address);
      this.showAddressRegistrationInfo = this.transaction.version === TransactionVersion.ERC20AddressRegistration;
    }
  }

  submit() {
    this.confirmTransaction.emit();
  }
}

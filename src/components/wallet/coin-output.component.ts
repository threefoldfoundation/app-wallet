import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { COIN_TO_HASTINGS_PRECISION, CoinOutput, CopyEventData } from '../../interfaces';
import { isv0Output } from '../../util';

@Component({
  selector: 'coin-output',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'coin-output.component.html'
})
export class CoinOutputComponent {
  digits = `1.0-${COIN_TO_HASTINGS_PRECISION}`;
  isv0Output = isv0Output;
  @Input() coinOutput: CoinOutput;
  @Output() copied = new EventEmitter<CopyEventData>();
}

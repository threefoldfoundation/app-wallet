import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CoinOutput, CopyEventData } from '../../interfaces';
import { isv0Output } from '../../util';

@Component({
  selector: 'coin-output',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'coin-output.component.html'
})
export class CoinOutputComponent {
  isv0Output = isv0Output;
  @Input() coinOutput: CoinOutput;
  @Output() copied = new EventEmitter<CopyEventData>();
}

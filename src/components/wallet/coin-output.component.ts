import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CoinOutput, CopyEventData } from '../../interfaces';

@Component({
  selector: 'coin-output',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'coin-output.component.html'
})
export class CoinOutputComponent {
  @Input() coinOutput: CoinOutput;
  @Output() copied = new EventEmitter<CopyEventData>();
}

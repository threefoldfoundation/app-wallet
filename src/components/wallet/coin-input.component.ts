import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { CoinInput } from '../../interfaces/wallet';

@Component({
  selector: 'coin-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'coin-input.component.html'
})
export class CoinInputComponent {
  @Input() coinInput: CoinInput;
}

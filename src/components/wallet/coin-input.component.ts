import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { CoinInput } from '../../interfaces/wallet';
import { isv0Input } from '../../util';

@Component({
  selector: 'coin-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'coin-input.component.html'
})
export class CoinInputComponent {
  isv0Input = isv0Input;
  @Input() coinInput: CoinInput;
}

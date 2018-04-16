import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { FulFillment, InputType } from '../../interfaces/wallet';

@Component({
  selector: 'fulfillment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'fulfillment.component.html'
})
export class FulfillmentComponent {
  InputType = InputType;
  @Input() fulfillment: FulFillment;
}

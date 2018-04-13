import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CopyEventData, OutputCondition, OutputType } from '../../interfaces/wallet';

@Component({
  selector: 'output-condition',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'output-condition.component.html'
})
export class OutputConditionComponent {
  OutputType = OutputType;
  dateformat = 'medium';
  @Input() condition: OutputCondition;
  @Output() copied = new EventEmitter<CopyEventData>();
}

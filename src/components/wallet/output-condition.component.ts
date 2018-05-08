import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CopyEventData, LOCKTIME_BLOCK_LIMIT, OutputCondition, OutputType } from '../../interfaces/wallet';

@Component({
  selector: 'output-condition',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'output-condition.component.html'
})
export class OutputConditionComponent {
  OutputType = OutputType;
  LOCKTIME_BLOCK_LIMIT = LOCKTIME_BLOCK_LIMIT;
  @Input() condition: OutputCondition;
  @Output() copied = new EventEmitter<CopyEventData>();
}

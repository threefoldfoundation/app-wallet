import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LOCKTIME_BLOCK_LIMIT } from '../../interfaces/wallet';

@Component({
  selector: 'unlocks-on',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'unlocks-on.component.html',
})
export class UnlocksOnComponent {
  LOCKTIME_BLOCK_LIMIT = LOCKTIME_BLOCK_LIMIT;
  dateformat = 'medium';
  @Input() locktime: number;
}

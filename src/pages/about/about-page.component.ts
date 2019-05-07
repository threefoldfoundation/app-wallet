import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { configuration } from '../../configuration';

@Component({
  templateUrl: 'about-page.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  walletVersion = configuration.version;
  buildTime = configuration.buildTime;
  appVersion = rogerthat.system.appVersion;
  osVersion = rogerthat.system.version;
}

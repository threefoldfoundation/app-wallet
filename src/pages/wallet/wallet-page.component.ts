import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Platform } from 'ionic-angular';
import { ReceivePageComponent } from './receive-page.component';
import { SendPageComponent } from './send-page.component';
import { TransactionsListPageComponent } from './transactions-list-page.component';

export interface TabPage {
  component: any;
  title: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'wallet-page.component.html',
})
export class WalletPageComponent implements OnInit {
  tabs: TabPage[];

  constructor(private platform: Platform) {
  }

  ngOnInit() {
    this.tabs = [{
      component: SendPageComponent,
      title: 'send',
    }, {
      component: TransactionsListPageComponent,
      title: 'transactions',
    }, {
      component: ReceivePageComponent,
      title: 'receive',
    }];
  }

  close() {
    this.platform.exitApp();
  }
}

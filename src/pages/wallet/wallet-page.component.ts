import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { getKeyPairProvider, IAppState } from '../../state';
import { filterNull } from '../../util';
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
  pageTitle$: Observable<string>;

  constructor(private store: Store<IAppState>,
              private translate: TranslateService) {
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
    this.pageTitle$ = this.store.pipe(
      select(getKeyPairProvider),
      filterNull(),
      switchMap(keyPair => this.translate.get('wallet_name', { name: keyPair.name }))
    );
  }
}

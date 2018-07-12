import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, NavController, NavParams, Platform } from 'ionic-angular';
import { KeyPair } from 'rogerthat-plugin';
import { Observable } from 'rxjs';
import { ListKeyPairsAction, SetSelectedKeyPairAction } from '../../actions';
import { getKeyPairs, IAppState } from '../../state';
import { WalletPageComponent } from '../wallet';
import { AddWalletPageComponent } from './add-wallet-page.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'wallet-chooser-page.component.html',
})
export class WalletChooserPageComponent implements OnInit {
  keyPairs$: Observable<KeyPair[]>;

  constructor(private store: Store<IAppState>,
              private navParams: NavParams,
              private navController: NavController,
              private platform: Platform,
              private translate: TranslateService,
              private alertController: AlertController) {
  }

  ngOnInit() {
    this.store.dispatch(new ListKeyPairsAction());
    this.keyPairs$ = this.store.pipe(select(getKeyPairs));
  }

  close() {
    this.platform.exitApp();
  }

  nextPage(keyPair: KeyPair) {
    this.store.dispatch(new SetSelectedKeyPairAction(keyPair));
    const page = this.navParams.get('nextPage') || WalletPageComponent;
    const navParams = this.navParams.data;
    delete navParams[ 'nextPage' ];
    this.navController.push(page, navParams);
  }

  openNewWalletPage() {
    this.alertController.create({
      title: this.translate.instant('add_wallet'),
      message: this.translate.instant('import_or_create_wallet'),
      buttons: [
        {
          text: this.translate.instant('create'),
          handler: () => {
            this.navController.push(AddWalletPageComponent, { 'import': false });
          },
        },
        {
          text: this.translate.instant('import'),
          handler: () => {
            this.navController.push(AddWalletPageComponent, { 'import': true });
          },
        },
      ],
    }).present();
  }
}

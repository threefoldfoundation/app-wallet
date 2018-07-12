import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, NavController, NavParams } from 'ionic-angular';
import { CreateKeyPairAction, ListKeyPairsAction } from '../../actions';
import { configuration, defaultProvider, Provider } from '../../configuration';
import { CreateKeyPair } from '../../interfaces';
import { createKeyPairStatus, IAppState } from '../../state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'add-wallet-page.component.html',
})
export class AddWalletPageComponent implements OnInit {
  newKeyPair: CreateKeyPair = {
    algorithm: defaultProvider.algorithm,
    name: defaultProvider.name,
    seed: null,
    arbitrary_data: null,
  };
  providers = configuration.providers;
  selectedProvider: Provider = defaultProvider;
  importing: boolean;
  buttonText: string;

  constructor(private navParams: NavParams,
              private navController: NavController,
              private translate: TranslateService,
              private alertController: AlertController,
              private store: Store<IAppState>) {
  }

  ngOnInit() {
    this.importing = this.navParams.get('import');
    this.buttonText = this.translate.instant(this.importing ? 'import_wallet' : 'create_wallet');
    this.store.pipe(select(createKeyPairStatus)).subscribe(result => {
      if (result.error && result.error.data) {
        let message = result.error.data.message;
        if (result.error.data.code === 'key_already_exists') {
          message = this.translate.instant('you_already_have_wallet_with_name');
        }
        this.alertController.create({ title: this.translate.instant('error'), message }).present();
      } else if (result.success) {
        this.store.dispatch(new ListKeyPairsAction());
        this.navController.pop();
      }
    });
  }

  onProviderChange(provider: Provider) {
    this.newKeyPair = {
      algorithm: provider.algorithm,
      name: provider.name,
      seed: null,
      arbitrary_data: JSON.stringify({ provider_id: provider.providerId }),
    };
  }

  submit() {
    this.store.dispatch(new CreateKeyPairAction(this.newKeyPair));
  }
}

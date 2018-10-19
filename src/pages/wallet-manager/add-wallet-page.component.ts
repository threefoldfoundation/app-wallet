import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertButton, AlertController, NavController, NavParams } from 'ionic-angular';
import { Subscription } from 'rxjs';
import {
  CreateKeyPairAction,
  CreateKeyPairCompleteAction,
  CreateKeyPairFailedAction,
  ListKeyPairsAction,
  RogerthatActionTypes
} from '../../actions';
import { configuration, defaultProvider, Provider } from '../../configuration';
import { CreateKeyPair } from '../../interfaces';
import { IAppState } from '../../state';
import { SeedInfoPageComponent } from './seed-info-page.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'add-wallet-page.component.html',
})
export class AddWalletPageComponent implements OnInit, OnDestroy {
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

  private _failSub: Subscription;
  private _successSub: Subscription;

  constructor(private navParams: NavParams,
              private navController: NavController,
              private translate: TranslateService,
              private alertController: AlertController,
              private store: Store<IAppState>,
              private actions$: Actions,
              private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.importing = this.navParams.get('import');
    this.buttonText = this.translate.instant(this.importing ? 'import_wallet' : 'create_wallet');

    this._failSub = this.actions$.pipe(
      ofType<CreateKeyPairFailedAction>(RogerthatActionTypes.CREATE_KEYPAIR_FAILED)
    ).subscribe(action => {
      const data = action.payload;
      let message = data.message;
      if (data.code === 'key_already_exists') {
        message = this.translate.instant('you_already_have_wallet_with_name');
      }
      const buttons: AlertButton[] = [{ text: this.translate.instant('ok'), role: 'cancel' }];
      this.alertController.create({ title: this.translate.instant('error'), message, buttons }).present();
    });
    this._successSub = this.actions$.pipe(
      ofType<CreateKeyPairCompleteAction>(RogerthatActionTypes.CREATE_KEYPAIR_COMPLETE)
    ).subscribe(action => {
      if (this.newKeyPair.seed) {
        this.navController.pop();
      } else {
        this.navController.pop().then(() => this.navController.push(SeedInfoPageComponent, { seed: action.payload.seed }));
      }
      this.store.dispatch(new ListKeyPairsAction());
    });
    // Else the dropdown value doesn't show up due to a bug in ionic
    setInterval(() => this.cdRef.markForCheck(), 1);
  }

  ngOnDestroy() {
    this._failSub.unsubscribe();
    this._successSub.unsubscribe();
  }

  onProviderChange(provider: Provider) {
    this.newKeyPair = { ...this.newKeyPair, name: provider.name };
  }

  submit(form: NgForm) {
    if (!form.form.valid) {
      return;
    }
    const data: CreateKeyPair = {
      ...this.newKeyPair,
      algorithm: this.selectedProvider.algorithm,
      seed: this.newKeyPair.seed ? this.newKeyPair.seed.trim() : null,
      arbitrary_data: JSON.stringify({ provider_id: this.selectedProvider.providerId })
    };
    this.store.dispatch(new CreateKeyPairAction(data));
  }
}

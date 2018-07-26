import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-header>
      <ion-navbar>
        <ion-title>{{ 'add_wallet' | translate }}</ion-title>
      </ion-navbar>
    </ion-header>
    <ion-content padding>
      <p>{{ 'wallet_seed_explanation' | translate }}</p>
      <p class="color-danger">{{ 'wallet_seed_warning' | translate }}</p>
      <div class="seed-box">{{ seed }}</div>
      <ion-row justify-content-center>
        <button ion-button ngxClipboard [cbContent]="seed" (cbOnSuccess)="showCopiedToast($event)">
          {{ 'copy_to_clipboard' | translate }}
        </button>
        <button ion-button (click)="close()">{{ 'close' | translate }}</button>
      </ion-row>
    </ion-content>`,
  styles: [`.seed-box {
    -webkit-user-select: text;
    user-select: text;
    border: 1px solid #ccc;
    padding: 8px;
    background: #eee;
    font-size: 1.3em;
  }`]
})
export class SeedInfoPageComponent {
  seed: string;

  constructor(private navParams: NavParams,
              private navController: NavController,
              private toastController: ToastController,
              private translate: TranslateService) {
    this.seed = this.navParams.get('seed');
  }

  close() {
    this.navController.pop();
  }

  showCopiedToast(event: { isSuccess: boolean }) {
    if (event.isSuccess) {
      this.toastController.create({
        message: this.translate.instant('seed_copied_to_clipboard'),
        duration: 3000,
        position: 'bottom',
        showCloseButton: true,
        closeButtonText: this.translate.instant('ok'),
      }).present();
    }
  }
}

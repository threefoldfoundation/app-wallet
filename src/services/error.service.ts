import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from 'ionic-angular';
import { RogerthatError } from '../manual_typings/rogerthat-errors';

@Injectable()
export class ErrorService {
  constructor(private translate: TranslateService,
              private alertCtrl: AlertController,
              private inAppBrowser: InAppBrowser) {
  }

  /**
   * Tries its best to show a human-readable error message in the user his language.
   */
  getErrorMessage(error: string | RogerthatError | Error | null): string {
    if (!error) {
      return '';
    }
    let err: RogerthatError;
    if (typeof error === 'string') {
      error = {
        code: error,
        message: error,
      };
    }
    if ((<RogerthatError>error).code) {
      err = <RogerthatError>error;
    } else {
      // could be any error like a reference error, log it here for clarity
      console.error(error);
      err = {
        code: 'unknown',
        message: (<Error>error).message,
      };
    }
    const key = `errors.${err.code}`;
    const translations = this.translate.store.translations[ this.translate.store.currentLang ] || {};
    let translation;
    if (err.code in (translations[ 'errors' ] || {})) {
      translation = this.translate.instant(key);
    } else {
      if (err.message) {
        // Error should have been translated by the server
        translation = err.message;
      } else {
        console.error(`missing translation key: ${key} for language ${this.translate.store.currentLang}`);
        translation = this.translate.instant('errors.unknown');
      }
    }
    return translation;
  }

  showVersionNotSupported(errorMessage: string) {
    const url = `https://rogerth.at/install?a=${rogerthat.system.appId}`;
    const alert = this.alertCtrl.create({
      title: this.translate.instant('update_required'),
      message: errorMessage,
      buttons: [ {
        text: this.translate.instant('update_app'),
        handler: () => {
          this.inAppBrowser.create(url, '_system');
        },
      }, {
        text: this.translate.instant('close'),
      } ],
    });
    alert.present();
    return alert;
  }
}

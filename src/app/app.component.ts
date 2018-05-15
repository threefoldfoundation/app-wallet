import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Actions } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from 'ionic-angular';
import { CreatePaymentRequestContext, RogerthatContextType } from 'rogerthat-plugin';
import { configuration } from '../configuration';
import { WalletChooserPageComponent } from '../pages/wallet-manager';
import { PayWidgetPageComponent } from '../pages/wallet';
import { ErrorService, RogerthatService } from '../services';

interface RootPage {
  page: any;
  params: any;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ion-nav [root]="root.page" [rootParams]="root.params" *ngIf="platformReady"></ion-nav>',
})
export class AppComponent implements OnInit {
  root: RootPage;
  platformReady = false;

  constructor(private platform: Platform,
              private statusBar: StatusBar,
              private splashScreen: SplashScreen,
              private translate: TranslateService,
              private rogerthatService: RogerthatService,
              private cdRef: ChangeDetectorRef,
              private errorService: ErrorService,
              private actions$: Actions) {
    translate.setDefaultLang('en');
    platform.ready().then(() => {
      rogerthat.callbacks.ready(() => {
        if (rogerthat.system.appId.includes('staging')) {
          statusBar.backgroundColorByHexString('#5f9e62');
        }
        if (rogerthat.system.os === 'android') {
          statusBar.styleBlackTranslucent();
        } else {
          statusBar.styleDefault();
        }
        splashScreen.hide();
        this.rogerthatService.initialize();
        const version = this.rogerthatService.getVersion();
        let mustUpdate = false;
        if (rogerthat.system.os === 'ios') {
          if (version.patch < 2947) {
            mustUpdate = true;
          }
        } else {
          if (version.patch < 4235) {
            mustUpdate = true;
          }
        }
        this.rogerthatService.getContext().subscribe(context => {
          const root = this.processContext(context);
          if (mustUpdate) {
            const alert = this.errorService.showVersionNotSupported(this.translate.instant('not_supported_pls_update'));
            alert.onDidDismiss(() => platform.exitApp());
            return;
          }
          if (root) {
            this.root = root;
          }
          this.platformReady = true;
          this.cdRef.detectChanges();
        });
      });
    });
  }

  ngOnInit() {
    // Useful for debugging
    if (configuration.production) {
      this.actions$.subscribe(action => console.log(JSON.stringify(action)));
    } else {
      this.actions$.subscribe(action => console.log(action));
    }
  }

  private processContext(data: any): RootPage | null {
    if (data.context && data.context.t) {
      switch (data.context.t) {
        case RogerthatContextType.TRANSACTION:
          // Currently not supported, just show the wallet instead
          return {page: WalletChooserPageComponent, params: null};
        case RogerthatContextType.PAY:
          const payContext: any = data.context; // type PayWidgetData
          return {page: WalletChooserPageComponent, params: {payContext, nextPage: PayWidgetPageComponent}};
        default:
            const content = {
              success: false,
              code: 'not_supported',
              message: this.translate.instant('not_supported_pls_update'),
            };
            rogerthat.app.exitWithResult(JSON.stringify(content));
      }
    }
    return { page: WalletChooserPageComponent, params: null };
  }
}

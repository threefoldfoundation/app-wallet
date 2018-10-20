import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Actions } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from 'ionic-angular';
import { PayWidgetContextData, RogerthatContext, RogerthatContextType } from 'rogerthat-plugin';
import { configuration } from '../configuration';
import { CreateTransactionResult } from '../interfaces/wallet';
import { CreatePaymentRequestPageComponent, PaymentRequestPageComponent, PayWidgetPageComponent } from '../pages/payments';
import { TransactionDetailPageComponent } from '../pages/wallet';
import { WalletChooserPageComponent } from '../pages/wallet-manager';
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
          if (version.patch < 3073) {
            mustUpdate = true;
          }
        } else {
          if (version.patch < 4344) {
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

  private processContext(data: { context: RogerthatContext | null }): RootPage | null {
    if (data.context && data.context.type) {
      switch (data.context.type) {
        case RogerthatContextType.PAY_WIDGET:
          return {
            page: WalletChooserPageComponent,
            params: {
              payContext: data.context.data as PayWidgetContextData,
              nextPage: PayWidgetPageComponent,
              description: 'choose_wallet_for_payment',
            }
          };
        case RogerthatContextType.CREATE_PAYMENT_REQUEST:
          return {
            page: WalletChooserPageComponent,
            params: {
              nextPage: CreatePaymentRequestPageComponent,
              description: 'choose_wallet_for_payment',
            }
          };
        case RogerthatContextType.PAYMENT_REQUEST:
          const payContext = data.context;
          if (payContext.data.result) {
            const parsedResult = JSON.parse(payContext.data.result) as CreateTransactionResult;
            return { page: TransactionDetailPageComponent, params: { transactionId: parsedResult.transactionid } };
          }
          return {
            page: WalletChooserPageComponent, params: {
              payContext,
              nextPage: PaymentRequestPageComponent,
              description: 'choose_wallet_for_payment',
            }
          };
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

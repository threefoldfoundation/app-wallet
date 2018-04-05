import { CurrencyPipe, DatePipe, DecimalPipe, I18nPluralPipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { QRCodeModule } from 'angular2-qrcode';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { ClipboardModule } from 'ngx-clipboard';
import { ApiRequestStatusComponent, ConfirmSendComponent, SendComponent } from '../components';
import { RogerthatEffects, WalletEffects } from '../effects';
import {
  ConfirmSendPageComponent,
  PayWidgetPageComponent,
  ReceivePageComponent,
  SendPageComponent,
  TransactionDetailPageComponent,
  TransactionsListPageComponent,
  WalletPageComponent,
} from '../pages';
import { AmountPipe, LocaleDecimalPipe } from '../pipes';
import { ErrorService, I18nService, RogerthatService, WalletService } from '../services';
import { reducers } from '../state';
import { MissingTranslationWarnHandler } from '../util/missing-translation-handler';
import { AppComponent } from './app.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/');
}

const IONIC_NATIVE_PLUGINS = [InAppBrowser, StatusBar, SplashScreen];

export const PAGES = [
  ConfirmSendPageComponent,
  PayWidgetPageComponent,
  ReceivePageComponent,
  SendPageComponent,
  TransactionDetailPageComponent,
  TransactionsListPageComponent,
  WalletPageComponent,
];

export const COMPONENTS = [
  ApiRequestStatusComponent,
  ConfirmSendComponent,
  SendComponent,
];

export const SERVICES = [I18nService, RogerthatService, ErrorService, WalletService];

@NgModule({
  declarations: [
    AppComponent,
    PAGES,
    COMPONENTS,
    LocaleDecimalPipe,
    AmountPipe,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(AppComponent),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([WalletEffects, RogerthatEffects]),
    QRCodeModule,
    ClipboardModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    AppComponent,
    PAGES,
  ],
  providers: [
    DecimalPipe,
    DatePipe,
    CurrencyPipe,
    LocaleDecimalPipe,
    AmountPipe,
    I18nPluralPipe,
    SERVICES,
    IONIC_NATIVE_PLUGINS,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: MissingTranslationHandler, useClass: MissingTranslationWarnHandler},
  ],
})
export class AppModule {
}

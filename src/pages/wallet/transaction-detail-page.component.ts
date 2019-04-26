import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, Platform, ToastController, ViewController } from 'ionic-angular';
import { CryptoAddress } from 'rogerthat-plugin';
import { Observable, Subscription } from 'rxjs';
import { first, map, withLatestFrom } from 'rxjs/operators';
import { GetAddresssAction, GetBlockAction, GetTransactionAction, GetTransactionCompleteAction } from '../../actions';
import {
  ApiRequestStatus,
  ExplorerBlock,
  ExplorerBlockGET,
  ExplorerHashERC20Info,
  ParsedTransaction,
  TransactionVersion
} from '../../interfaces';
import { AmountPipe } from '../../pipes';
import {
  getAddress,
  getBlock,
  getErc20Info,
  getLatestBlock,
  getLatestBlockStatus,
  getSelectedKeyPair,
  getTransaction,
  getTransactionStatus,
  IAppState
} from '../../state';
import { filterNull } from '../../util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'transaction-detail-page.component.html'
})
export class TransactionDetailPageComponent implements OnInit, OnDestroy {
  transaction$: Observable<ParsedTransaction>;
  transactionStatus$: Observable<ApiRequestStatus>;
  latestBlock$: Observable<ExplorerBlock>;
  transactionBlock$: Observable<ExplorerBlockGET>;
  address$: Observable<CryptoAddress>;
  getLatestBlockStatus$: Observable<ApiRequestStatus>;
  erc20Info$: Observable<ExplorerHashERC20Info>;
  timestamp$: Observable<Date>;
  confirmations$: Observable<number>;
  TransactionVersion = TransactionVersion;

  private _transactionSub: Subscription;
  private _keyPairSubscription: Subscription;
  constructor(private params: NavParams,
              private translate: TranslateService,
              private amountPipe: AmountPipe,
              private viewCtrl: ViewController,
              private toastCtrl: ToastController,
              private store: Store<IAppState>,
              private platform: Platform) {
  }

  ngOnInit() {
    // TODO: explain address registration transaction a bit
    // TODO: show erc20 address in case of coin creation
    this.transaction$ = this.store.pipe(select(getTransaction), filterNull());
    this.transactionStatus$ = this.store.pipe(select(getTransactionStatus));
    this.latestBlock$ = this.store.pipe(select(getLatestBlock), filterNull());
    this.address$ = this.store.pipe(select(getAddress), filterNull());
    this.erc20Info$ = this.store.pipe(select(getErc20Info), filterNull());
    this.confirmations$ = this.latestBlock$.pipe(
      withLatestFrom(this.transaction$),
      map(([block, transaction]) => block.height - transaction.height),
    );
    this.getLatestBlockStatus$ = this.store.pipe(select(getLatestBlockStatus));
    this.transactionBlock$ = this.store.pipe(select(getBlock), filterNull());
    this.timestamp$ = this.transactionBlock$.pipe(
      map(block => new Date(block.block.rawblock.timestamp * 1000)),
    );
    this._transactionSub = this.transaction$.subscribe(transaction => this.store.dispatch(new GetBlockAction(transaction.height)));
    this._keyPairSubscription = this.store.pipe(select(getSelectedKeyPair), filterNull()).subscribe(keyPair => {
      this.store.dispatch(new GetAddresssAction({
        algorithm: keyPair.algorithm,
        index: 0,
        keyName: keyPair.name,
        message: this.translate.instant('please_enter_your_pin'),
      }));
    });
    // 2 supported options, first one is the transaction being supplied as parameter, second one only the transaction id.
    // In case we only know the transaction id, get the address & the transaction first.
    if (this.params.get('transaction')) {
      this.store.dispatch(new GetTransactionCompleteAction(this.params.get('transaction') as ParsedTransaction));
    } else {
      const transactionId = this.params.get('transactionId');
      this.address$.pipe(first()).subscribe(address => this.store.dispatch(new GetTransactionAction(transactionId, address.address)));
    }
  }

  ngOnDestroy() {
    this._transactionSub.unsubscribe();
    this._keyPairSubscription.unsubscribe();
  }

  getAmount(amount: number) {
    return this.amountPipe.transform(Math.abs(amount));
  }

  showCopiedToast(result: { isSuccess: boolean, content?: string }) {
    if (result.isSuccess) {
      this.toastCtrl.create({
        message: this.translate.instant('address_copied_to_clipboard'),
        duration: 3000,
        position: 'bottom',
        showCloseButton: true,
        closeButtonText: this.translate.instant('ok'),
      }).present();
    }
  }

  dismiss() {
    if (this.viewCtrl.isOverlay) {
      this.viewCtrl.dismiss();
    } else {
      this.platform.exitApp();
    }
  }
}

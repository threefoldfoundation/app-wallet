import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, Platform, ToastController, ViewController } from 'ionic-angular';
import { CryptoAddress } from 'rogerthat-plugin';
import { Observable, Subscription } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import {
  GetBlockAction,
  GetHashInfoAction,
  GetTransactionAction,
  GetTransactionCompleteAction,
  SetSelectedKeyPairAction
} from '../../actions';
import { ApiRequestStatus, ExplorerBlock, ExplorerBlockGET, ParsedTransaction, PayChatTransactionResult } from '../../interfaces';
import { AmountPipe } from '../../pipes';
import { RogerthatService } from '../../services';
import { getBlock, getLatestBlock, getLatestBlockStatus, getTransaction, getTransactionStatus, IAppState } from '../../state';
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
  getLatestBlockStatus$: Observable<ApiRequestStatus>;
  timestamp$: Observable<Date>;
  confirmations$: Observable<number>;

  private _transactionSub: Subscription;

  constructor(private params: NavParams,
              private translate: TranslateService,
              private amountPipe: AmountPipe,
              private viewCtrl: ViewController,
              private toastCtrl: ToastController,
              private store: Store<IAppState>,
              private platform: Platform,
              private rtService: RogerthatService) {
  }

  ngOnInit() {
    this.transaction$ = this.store.pipe(select(getTransaction), filterNull());
    this.transactionStatus$ = this.store.pipe(select(getTransactionStatus));
    this.latestBlock$ = this.store.pipe(select(getLatestBlock), filterNull());
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
    // 2 supported options, first one is the transaction being supplied as parameter, second one only the transaction id.
    // In case we only know the transaction id, get the address & the transaction first.
    if (this.params.get('transaction')) {
      this.store.dispatch(new GetTransactionCompleteAction(this.params.get('transaction') as ParsedTransaction));
    } else {
      const transactionInfo: PayChatTransactionResult = this.params.get('appTransaction');
      this.rtService.listAddresses().subscribe((addresses) => {
        const from = addresses.find(a => a.address.address === transactionInfo.from_address);
        const to = addresses.find(a => a.address.address === transactionInfo.to_address);
        let ownAddress: CryptoAddress | null = null;
        if (from) {
          this.store.dispatch(new SetSelectedKeyPairAction(from.keyPair));
          ownAddress = from.address;
        }
        if (to) {
          this.store.dispatch(new SetSelectedKeyPairAction(to.keyPair));
          ownAddress = to.address;
        }
        if (ownAddress) {
          this.store.dispatch(new GetHashInfoAction(ownAddress.address));
          this.store.dispatch(new GetTransactionAction(transactionInfo.transaction.transactionid, ownAddress.address));
        } else {
          // TODO "It looks like this transaction was made using a wallet that is not present on this phone yet, do you want to import it?"
        }
      });
    }
  }

  ngOnDestroy() {
    this._transactionSub.unsubscribe();
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

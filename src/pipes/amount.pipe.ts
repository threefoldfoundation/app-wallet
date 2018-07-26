import { Injectable, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { COIN_TO_HASTINGS, CURRENCY_DETAIL_DIGITS } from '../interfaces';
import { getKeyPairProvider, IAppState } from '../state';
import { filterNull } from '../util';
import { LocaleDecimalPipe } from './localized-pipes';

@Injectable()
@Pipe({ name: 'amount', pure: true })
export class AmountPipe implements PipeTransform, OnDestroy {
  symbol: string;
  private _sub: Subscription;

  constructor(private store: Store<IAppState>,
              private decimalPipe: LocaleDecimalPipe) {
    this._sub = this.store.pipe(select(getKeyPairProvider), filterNull()).subscribe(provider => {
      this.symbol = provider.symbol;
    });
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  transform(value: string | number, digits?: string) {
    const amount = (typeof value === 'number' ? value : parseInt(value)) / COIN_TO_HASTINGS;
    return `${this.decimalPipe.transform(amount, digits || CURRENCY_DETAIL_DIGITS)} ${this.symbol}`;
  }
}

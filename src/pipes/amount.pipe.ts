import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { COIN_TO_HASTINGS, CURRENCY_DETAIL_DIGITS, CURRENCY_SYMBOL } from '../interfaces';
import { LocaleDecimalPipe } from './localized-pipes';

@Injectable()
@Pipe({ name: 'amount', pure: true })
export class AmountPipe implements PipeTransform {
  constructor(private decimalPipe: LocaleDecimalPipe) {

  }

  transform(value: string | number, digits?: string) {
    const amount = (typeof value === 'number' ? value : parseInt(value)) / COIN_TO_HASTINGS;
    return `${this.decimalPipe.transform(amount, digits || CURRENCY_DETAIL_DIGITS)} ${CURRENCY_SYMBOL}`;
  }
}

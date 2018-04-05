import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Change pure to false if you want to support dynamically changing languages
@Pipe({
  name: 'localenumber',
  pure: true,
})
export class LocaleDecimalPipe implements PipeTransform {
  constructor(private translateService: TranslateService) {
  }

  transform(value: number, digits?: string): string | null {
    return new DecimalPipe(this.translateService.currentLang).transform(value, digits);
  }
}

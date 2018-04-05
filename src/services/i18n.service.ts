import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = [ 'en' ];

@Injectable()
export class I18nService {
  constructor(private translate: TranslateService) {
  }

  use(language: string) {
    let lang;
    if (SUPPORTED_LANGUAGES.indexOf(language) === -1) {
      const split = language.split('_')[ 0 ];
      if (SUPPORTED_LANGUAGES.indexOf(split) === -1) {
        lang = DEFAULT_LANGUAGE;
      } else {
        lang = split;
      }
    } else {
      lang = language;
    }
    console.log(`Set language to ${lang}`);
    return this.translate.use(lang);
  }
}

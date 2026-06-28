import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private language: LanguageService) {}

  transform(key: string, params?: Record<string, string | number>): string {
    return this.language.t(key, params);
  }
}

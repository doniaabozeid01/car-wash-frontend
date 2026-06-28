import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY = 'fullcars_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly langSubject = new BehaviorSubject<AppLanguage>('en');
  readonly language$ = this.langSubject.asObservable();

  init(): void {
    const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    this.setLanguage(saved === 'ar' ? 'ar' : 'en', false);
  }

  get current(): AppLanguage {
    return this.langSubject.value;
  }

  isRtl(): boolean {
    return this.current === 'ar';
  }

  setLanguage(lang: AppLanguage, persist = true): void {
    this.langSubject.next(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (persist) {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }

  toggleLanguage(): void {
    this.setLanguage(this.current === 'ar' ? 'en' : 'ar');
  }

  t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split('.');
    let value: unknown = TRANSLATIONS[this.current];

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = this.lookupFallback(key);
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    return this.interpolate(value, params);
  }

  private lookupFallback(key: string): string {
    const parts = key.split('.');
    let value: unknown = TRANSLATIONS.en;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  private interpolate(text: string, params?: Record<string, string | number>): string {
    if (!params) {
      return text;
    }

    return Object.entries(params).reduce(
      (result, [key, val]) => result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(val)),
      text
    );
  }
}

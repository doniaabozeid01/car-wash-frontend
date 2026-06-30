import { Component, Input } from '@angular/core';
import { AppLanguage } from '../../i18n/translations';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-toggle',
  templateUrl: './language-toggle.component.html',
  styleUrls: ['./language-toggle.component.scss']
})
export class LanguageToggleComponent {
  @Input() compact = false;

  constructor(public language: LanguageService) {}

  get currentLabelKey(): string {
    return this.language.current === 'ar' ? 'lang.en' : 'lang.ar';
  }

  get switchLabelKey(): string {
    return this.language.current === 'ar' ? 'lang.switchToEn' : 'lang.switchToAr';
  }

  toggleLanguage(): void {
    const next: AppLanguage = this.language.current === 'ar' ? 'en' : 'ar';
    this.language.setLanguage(next);
  }
}

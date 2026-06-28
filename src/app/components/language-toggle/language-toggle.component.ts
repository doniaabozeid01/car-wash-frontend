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

  setLanguage(lang: AppLanguage): void {
    if (this.language.current !== lang) {
      this.language.setLanguage(lang);
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { LanguageService } from './services/language.service';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentYear = new Date().getFullYear();

  constructor(
    private language: LanguageService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    this.language.init();
    this.seo.init();
  }
}

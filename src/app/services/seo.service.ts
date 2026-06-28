import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly shareImagePath = '/assets/og-share.png';

  constructor(
    private meta: Meta,
    private title: Title,
    private language: LanguageService,
    private router: Router
  ) {}

  init(): void {
    this.language.language$.subscribe(() => this.refresh());

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.refresh());

    this.refresh();
  }

  private refresh(): void {
    const routeMeta = this.getRouteMeta();
    const pageUrl = this.getPageUrl();
    const imageUrl = this.getShareImageUrl();
    const title = this.language.t(routeMeta.titleKey);
    const description = this.language.t(routeMeta.descriptionKey);
    const keywords = this.language.t('seo.keywords');
    const imageAlt = this.language.t('seo.imageAlt');

    this.title.setTitle(title);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'author', content: 'FULL CARS' });
    this.meta.updateTag({ name: 'application-name', content: 'FULL CARS' });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'FULL CARS' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:image:secure_url', content: imageUrl });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/png' });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:image:alt', content: imageAlt });
    this.meta.updateTag({ property: 'og:locale', content: this.language.current === 'ar' ? 'ar_EG' : 'en_US' });
    this.meta.updateTag({
      property: 'og:locale:alternate',
      content: this.language.current === 'ar' ? 'en_US' : 'ar_EG'
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image:alt', content: imageAlt });

    this.updateCanonical(pageUrl);
    this.updateStructuredData(title, description, pageUrl, imageUrl);
  }

  private getRouteMeta(): { titleKey: string; descriptionKey: string } {
    const path = this.router.url.split('?')[0];

    switch (path) {
      case '/login':
        return { titleKey: 'seo.loginTitle', descriptionKey: 'seo.loginDescription' };
      case '/register':
        return { titleKey: 'seo.registerTitle', descriptionKey: 'seo.registerDescription' };
      default:
        return { titleKey: 'seo.title', descriptionKey: 'seo.description' };
    }
  }

  private getPageUrl(): string {
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}${this.router.url.split('?')[0] || '/'}`;
    }

    return environment.siteUrl;
  }

  private getShareImageUrl(): string {
    const baseUrl = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : environment.siteUrl;

    return `${baseUrl}${this.shareImagePath}`;
  }

  private updateCanonical(url: string): void {
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private updateStructuredData(title: string, description: string, url: string, imageUrl: string): void {
    const scriptId = 'fullcars-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AutomotiveBusiness',
      name: 'FULL CARS',
      url,
      logo: imageUrl,
      image: imageUrl,
      description,
      inLanguage: this.language.current === 'ar' ? 'ar-EG' : 'en-US'
    });
  }
}

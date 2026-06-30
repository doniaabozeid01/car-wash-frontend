import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpsertServiceInput, WashServiceItem } from '../models/cashier.models';

const JSON_HEADERS = new HttpHeaders({
  'Content-Type': 'application/json',
  Accept: 'application/json'
});

@Injectable({ providedIn: 'root' })
export class WashServicesService {
  private readonly servicesSubject = new BehaviorSubject<WashServiceItem[]>([]);

  readonly services$ = this.servicesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getServices(): WashServiceItem[] {
    return this.servicesSubject.value;
  }

  load(): Observable<WashServiceItem[]> {
    return this.http.get<unknown>(this.apiUrl('/api/wash-services')).pipe(
      map((response) => this.mapList(response)),
      tap((services) => this.servicesSubject.next(services))
    );
  }

  create(input: UpsertServiceInput): Observable<WashServiceItem[]> {
    return this.http
      .post<unknown>(this.apiUrl('/api/wash-services'), input, { headers: JSON_HEADERS })
      .pipe(switchMap(() => this.load()));
  }

  update(id: number, input: UpsertServiceInput): Observable<WashServiceItem[]> {
    return this.http
      .put<unknown>(this.apiUrl(`/api/wash-services/${id}`), input, { headers: JSON_HEADERS })
      .pipe(switchMap(() => this.load()));
  }

  delete(id: number): Observable<WashServiceItem[]> {
    return this.http
      .delete<void>(this.apiUrl(`/api/wash-services/${id}`))
      .pipe(switchMap(() => this.load()));
  }

  private mapList(response: unknown): WashServiceItem[] {
    const list = Array.isArray(response) ? response : [];
    return list.map((item) => this.mapItem(item as Record<string, unknown>));
  }

  private mapItem(raw: Record<string, unknown>): WashServiceItem {
    const points = Number(raw['points'] ?? raw['Points'] ?? 0);

    return {
      id: Number(raw['id'] ?? raw['Id'] ?? 0),
      nameEn: String(raw['nameEn'] ?? raw['NameEn'] ?? ''),
      nameAr: String(raw['nameAr'] ?? raw['NameAr'] ?? ''),
      points,
      price: this.defaultPriceForPoints(points)
    };
  }

  private defaultPriceForPoints(points: number): number {
    if (points < 0) {
      return 0;
    }

    if (points >= 50) {
      return 150;
    }

    return 100;
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}

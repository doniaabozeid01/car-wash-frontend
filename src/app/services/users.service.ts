import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { SubscriberUser } from '../models/cashier.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  load(year: number, month: number, activeOnly: boolean): Observable<SubscriberUser[]> {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month)
      .set('activeOnly', activeOnly);

    return this.http
      .get<unknown>(this.apiUrl('/api/Users'), { params })
      .pipe(map((response) => this.mapList(response)));
  }

  private mapList(response: unknown): SubscriberUser[] {
    const list = Array.isArray(response) ? response : [];
    return list.map((item) => this.mapUser(item as Record<string, unknown>));
  }

  private mapUser(raw: Record<string, unknown>): SubscriberUser {
    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      fullName: String(raw['fullName'] ?? raw['FullName'] ?? ''),
      phoneNumber: String(raw['phoneNumber'] ?? raw['PhoneNumber'] ?? '')
    };
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}

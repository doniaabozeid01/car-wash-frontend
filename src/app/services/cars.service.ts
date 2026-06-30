import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateCarInput, UserCarRecord } from '../models/cashier.models';

const JSON_HEADERS = new HttpHeaders({
  'Content-Type': 'application/json',
  Accept: 'application/json'
});

@Injectable({ providedIn: 'root' })
export class CarsService {
  constructor(private http: HttpClient) {}

  loadByUser(userId: string): Observable<UserCarRecord[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http
      .get<unknown>(this.apiUrl('/api/Cars'), { params })
      .pipe(map((response) => this.mapList(response)));
  }

  create(input: CreateCarInput): Observable<void> {
    return this.http.post<void>(this.apiUrl('/api/Cars'), input, { headers: JSON_HEADERS });
  }

  delete(carId: number, userId: string): Observable<void> {
    const params = new HttpParams().set('userId', userId);
    return this.http.delete<void>(this.apiUrl(`/api/Cars/${carId}`), { params });
  }

  private mapList(response: unknown): UserCarRecord[] {
    const list = Array.isArray(response) ? response : [];
    return list.map((item) => this.mapCar(item as Record<string, unknown>));
  }

  private mapCar(raw: Record<string, unknown>): UserCarRecord {
    return {
      id: Number(raw['id'] ?? raw['Id'] ?? 0),
      carType: String(raw['carType'] ?? raw['CarType'] ?? ''),
      plateNumber: String(raw['plateNumber'] ?? raw['PlateNumber'] ?? ''),
      size: Number(raw['size'] ?? raw['Size'] ?? 0),
      points: Number(raw['points'] ?? raw['Points'] ?? 0)
    };
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}

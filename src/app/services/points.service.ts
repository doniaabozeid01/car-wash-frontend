import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApplyPointsRequest,
  ApplyPointsResult,
  PointsActionType,
  ScannedCustomer
} from '../models/points.models';

const JSON_HEADERS = new HttpHeaders({
  'Content-Type': 'application/json',
  Accept: 'application/json'
});

@Injectable({ providedIn: 'root' })
export class PointsService {
  constructor(private http: HttpClient) {}

  scanQrCode(qrCode: string): Observable<ScannedCustomer> {
    const encoded = encodeURIComponent(qrCode.trim());
    return this.http
      .get<Record<string, unknown>>(this.apiUrl(`/api/Points/scan/${encoded}`))
      .pipe(map((response) => this.mapCustomer(response)));
  }

  applyAction(qrCode: string, action: PointsActionType): Observable<ApplyPointsResult> {
    const body: ApplyPointsRequest = { qrCode: qrCode.trim(), action };
    return this.http
      .post<Record<string, unknown>>(this.apiUrl('/api/Points/apply'), body, { headers: JSON_HEADERS })
      .pipe(map((response) => this.mapApplyResult(response)));
  }

  private mapCustomer(raw: Record<string, unknown>): ScannedCustomer {
    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      fullName: String(raw['fullName'] ?? raw['FullName'] ?? ''),
      phoneNumber: String(raw['phoneNumber'] ?? raw['PhoneNumber'] ?? ''),
      points: Number(raw['points'] ?? raw['Points'] ?? 0)
    };
  }

  private mapApplyResult(raw: Record<string, unknown>): ApplyPointsResult {
    return {
      points: Number(raw['points'] ?? raw['Points'] ?? 0),
      fullName: String(raw['fullName'] ?? raw['FullName'] ?? '')
    };
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApplyPointsRequest,
  ApplyPointsResult,
  ScannedCar,
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

  applyTransaction(request: ApplyPointsRequest): Observable<ApplyPointsResult> {
    return this.http
      .post<Record<string, unknown>>(this.apiUrl('/api/Points/apply'), request, {
        headers: JSON_HEADERS
      })
      .pipe(map((response) => this.mapApplyResult(response)));
  }

  private mapCustomer(raw: Record<string, unknown>): ScannedCustomer {
    const carsRaw = raw['cars'] ?? raw['Cars'];
    const cars = Array.isArray(carsRaw)
      ? carsRaw.map((item) => this.mapCar(item as Record<string, unknown>))
      : [];

    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      fullName: String(raw['fullName'] ?? raw['FullName'] ?? ''),
      phoneNumber: String(raw['phoneNumber'] ?? raw['PhoneNumber'] ?? ''),
      cars
    };
  }

  private mapApplyResult(raw: Record<string, unknown>): ApplyPointsResult {
    const carsRaw = raw['cars'] ?? raw['Cars'];
    const cars = Array.isArray(carsRaw)
      ? carsRaw.map((item) => this.mapCar(item as Record<string, unknown>))
      : [];

    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      fullName: String(raw['fullName'] ?? raw['FullName'] ?? ''),
      phoneNumber: String(raw['phoneNumber'] ?? raw['PhoneNumber'] ?? ''),
      cars
    };
  }

  private mapCar(raw: Record<string, unknown>): ScannedCar {
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

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { WashRecord, WashRecordsReport } from '../models/cashier.models';

const DEFAULT_FREE_WASH_SERVICE_ID = 3;

@Injectable({ providedIn: 'root' })
export class WashRecordsService {
  constructor(private http: HttpClient) {}

  load(year: number, month: number, washServiceId?: number): Observable<WashRecordsReport> {
    let params = new HttpParams().set('year', year).set('month', month);

    if (washServiceId != null) {
      params = params.set('washServiceId', washServiceId);
    }

    return this.http
      .get<unknown>(this.apiUrl('/api/wash-records'), { params })
      .pipe(map((response) => this.mapReport(response)));
  }

  private mapReport(response: unknown): WashRecordsReport {
    const raw = (response ?? {}) as Record<string, unknown>;
    const recordsRaw = raw['records'] ?? raw['Records'];
    const records = Array.isArray(recordsRaw)
      ? recordsRaw.map((item) => this.mapRecord(item as Record<string, unknown>))
      : [];

    return {
      totalAmount: Number(raw['totalAmount'] ?? raw['TotalAmount'] ?? 0),
      cashCount: Number(raw['cashCount'] ?? raw['CashCount'] ?? 0),
      networkCount: Number(raw['networkCount'] ?? raw['NetworkCount'] ?? 0),
      records
    };
  }

  private mapRecord(raw: Record<string, unknown>): WashRecord {
    const paymentMethod = raw['paymentMethod'] ?? raw['PaymentMethod'];

    return {
      id: Number(raw['id'] ?? raw['Id'] ?? 0),
      userId: String(raw['userId'] ?? raw['UserId'] ?? ''),
      userFullName: String(raw['userFullName'] ?? raw['UserFullName'] ?? ''),
      carId: Number(raw['carId'] ?? raw['CarId'] ?? 0),
      plateNumber: String(raw['plateNumber'] ?? raw['PlateNumber'] ?? ''),
      carType: String(raw['carType'] ?? raw['CarType'] ?? ''),
      carSize: Number(raw['carSize'] ?? raw['CarSize'] ?? 0),
      washServiceId: Number(raw['washServiceId'] ?? raw['WashServiceId'] ?? 0),
      serviceNameAr: String(raw['serviceNameAr'] ?? raw['ServiceNameAr'] ?? ''),
      serviceNameEn: String(raw['serviceNameEn'] ?? raw['ServiceNameEn'] ?? ''),
      pointsChange: Number(raw['pointsChange'] ?? raw['PointsChange'] ?? 0),
      carPointsAfter: Number(raw['carPointsAfter'] ?? raw['CarPointsAfter'] ?? 0),
      amountPaid: Number(raw['amountPaid'] ?? raw['AmountPaid'] ?? 0),
      paymentMethod: paymentMethod == null ? null : Number(paymentMethod),
      createdAt: String(raw['createdAt'] ?? raw['CreatedAt'] ?? '')
    };
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}

export { DEFAULT_FREE_WASH_SERVICE_ID };

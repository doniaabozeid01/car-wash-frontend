import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  MonthlyActivitySummary,
  WashRecord
} from '../../../models/cashier.models';
import { LanguageService } from '../../../services/language.service';
import {
  DEFAULT_FREE_WASH_SERVICE_ID,
  WashRecordsService
} from '../../../services/wash-records.service';
import { WashServicesService } from '../../../services/wash-services.service';

interface PeriodOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-cashier-free-washes',
  templateUrl: './cashier-free-washes.component.html',
  styleUrls: ['./cashier-free-washes.component.scss']
})
export class CashierFreeWashesComponent implements OnInit, OnDestroy {
  records: WashRecord[] = [];
  summary: MonthlyActivitySummary = {
    totalPrice: 0,
    cashCount: 0,
    cardCount: 0,
    totalCount: 0
  };
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  freeWashOnly = false;
  loading = false;
  loadError = '';
  months: PeriodOption[] = [];
  years: number[] = [];

  private langSub?: Subscription;

  constructor(
    private washRecords: WashRecordsService,
    private washServices: WashServicesService,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.buildPeriodOptions();
    this.langSub = this.language.language$.subscribe(() => this.buildPeriodOptions());
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  onFiltersChange(): void {
    this.loadRecords();
  }

  toggleFreeWashFilter(): void {
    this.freeWashOnly = !this.freeWashOnly;
    this.loadRecords();
  }

  serviceName(record: WashRecord): string {
    const name = this.language.current === 'ar' ? record.serviceNameAr : record.serviceNameEn;
    return name || record.serviceNameAr || record.serviceNameEn;
  }

  paymentLabel(record: WashRecord): string | null {
    if (record.paymentMethod == null) {
      return null;
    }

    return record.paymentMethod === 1
      ? 'cashier.freeWashes.paymentNetwork'
      : 'cashier.freeWashes.paymentCash';
  }

  formatPrice(price: number): string {
    const locale = this.language.current === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(price);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(
      this.language.current === 'ar' ? 'ar-EG' : 'en-US'
    );
  }

  private buildPeriodOptions(): void {
    const locale = this.language.current === 'ar' ? 'ar-EG' : 'en-US';
    this.months = Array.from({ length: 12 }, (_, index) => {
      const value = index + 1;
      return {
        value,
        label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, index, 1))
      };
    });

    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }

  private loadRecords(): void {
    this.loading = true;
    this.loadError = '';

    const washServiceId = this.freeWashOnly ? this.getFreeWashServiceId() : undefined;

    this.washRecords.load(this.selectedYear, this.selectedMonth, washServiceId).subscribe({
      next: (report) => {
        this.records = report.records;
        this.summary = {
          totalPrice: report.totalAmount,
          cashCount: report.cashCount,
          cardCount: report.networkCount,
          totalCount: report.records.length
        };
        this.loading = false;
      },
      error: () => {
        this.records = [];
        this.summary = {
          totalPrice: 0,
          cashCount: 0,
          cardCount: 0,
          totalCount: 0
        };
        this.loading = false;
        this.loadError = 'cashier.freeWashes.loadError';
      }
    });
  }

  private getFreeWashServiceId(): number {
    const service = this.washServices.getServices().find((item) => item.points < 0);
    return service?.id ?? DEFAULT_FREE_WASH_SERVICE_ID;
  }
}

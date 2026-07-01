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
import { buildDayOptions } from '../../../utils/period-filter.util';

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
  selectedMonth: number | null = new Date().getMonth() + 1;
  selectedDay: number | null = null;
  freeWashOnly = false;
  loading = false;
  loadError = '';
  currentPage = 1;
  readonly pageSize = 10;
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
    this.currentPage = 1;
    this.loadRecords();
  }

  onYearChange(): void {
    this.normalizeDaySelection();
    this.onFiltersChange();
  }

  onMonthChange(): void {
    if (this.selectedMonth == null) {
      this.selectedDay = null;
    } else {
      this.normalizeDaySelection();
    }
    this.onFiltersChange();
  }

  onDayChange(): void {
    this.onFiltersChange();
  }

  get days(): number[] {
    return buildDayOptions(this.selectedYear, this.selectedMonth);
  }

  get dayFilterDisabled(): boolean {
    return this.selectedMonth == null;
  }

  toggleFreeWashFilter(): void {
    this.freeWashOnly = !this.freeWashOnly;
    this.currentPage = 1;
    this.loadRecords();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.records.length / this.pageSize));
  }

  get paginatedRecords(): WashRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.records.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    if (!this.records.length) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.records.length);
  }

  get showPagination(): boolean {
    return !this.loading && this.records.length > this.pageSize;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
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
    const locale = this.language.current === 'ar' ? 'ar-SA' : 'en-SA';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(price);
  }

  formatRecordDate(iso: string): string {
    const locale = this.language.current === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatRecordTime(iso: string): string {
    const locale = this.language.current === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(iso).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
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

    this.washRecords
      .load(
        {
          year: this.selectedYear,
          month: this.selectedMonth,
          day: this.selectedDay
        },
        washServiceId
      )
      .subscribe({
      next: (report) => {
        this.records = report.records;
        this.currentPage = 1;
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
        this.currentPage = 1;
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

  private normalizeDaySelection(): void {
    if (this.selectedMonth == null || this.selectedDay == null) {
      return;
    }

    const maxDay = buildDayOptions(this.selectedYear, this.selectedMonth).length;
    if (this.selectedDay > maxDay) {
      this.selectedDay = null;
    }
  }
}

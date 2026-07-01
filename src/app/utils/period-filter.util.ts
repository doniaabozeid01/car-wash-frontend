import { HttpParams } from '@angular/common/http';

export interface PeriodFilter {
  year: number;
  month: number | null;
  day: number | null;
}

export function appendPeriodParams(params: HttpParams, filter: PeriodFilter): HttpParams {
  let next = params.set('year', filter.year);

  if (filter.month != null) {
    next = next.set('month', filter.month);
  }

  if (filter.day != null) {
    next = next.set('day', filter.day);
  }

  return next;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildDayOptions(year: number, month: number | null): number[] {
  if (month == null) {
    return [];
  }

  return Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1);
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  AddCarInput,
  CustomerCar,
  CustomerRecord,
  FreeWashRecord,
  MonthlyActivitySummary,
  PaymentMethod,
  SubscriberRow,
  WashServiceItem,
  WashTransaction
} from '../models/cashier.models';
import { ScannedCustomer } from '../models/points.models';
import { WashServicesService } from './wash-services.service';

const STORAGE_KEYS = {
  customers: 'fullcars_customers',
  freeWashes: 'fullcars_free_washes',
  transactions: 'fullcars_wash_transactions'
};

const NEW_CUSTOMER_DAYS = 30;

@Injectable({ providedIn: 'root' })
export class CashierStoreService {
  private readonly customersSubject = new BehaviorSubject<CustomerRecord[]>([]);
  private readonly freeWashesSubject = new BehaviorSubject<FreeWashRecord[]>([]);
  private readonly transactionsSubject = new BehaviorSubject<WashTransaction[]>([]);

  readonly services$: Observable<WashServiceItem[]>;
  readonly customers$ = this.customersSubject.asObservable();
  readonly freeWashes$ = this.freeWashesSubject.asObservable();
  readonly transactions$ = this.transactionsSubject.asObservable();

  constructor(private washServices: WashServicesService) {
    this.services$ = this.washServices.services$;
    this.loadAll();
  }

  getServices(): WashServiceItem[] {
    return this.washServices.getServices();
  }

  getCustomers(): CustomerRecord[] {
    return this.customersSubject.value;
  }

  getFreeWashCost(): number {
    const redeem = this.getServices().find((service) => service.points < 0);
    return Math.abs(redeem?.points ?? 250);
  }

  upsertCustomerFromScan(customer: ScannedCustomer): CustomerRecord {
    const customers = [...this.getCustomers()];
    const index = customers.findIndex((entry) => entry.id === customer.id);
    const now = new Date().toISOString();
    const totalPoints = customer.cars.reduce((sum, car) => sum + car.points, 0);

    if (index >= 0) {
      customers[index] = {
        ...customers[index],
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        points: totalPoints
      };
    } else {
      customers.push({
        id: customer.id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        points: totalPoints,
        createdAt: now,
        cars: []
      });
    }

    this.saveCustomers(customers);
    return customers.find((entry) => entry.id === customer.id)!;
  }

  updateCustomerPoints(customerId: string, points: number): void {
    const customers = this.getCustomers().map((customer) =>
      customer.id === customerId ? { ...customer, points } : customer
    );
    this.saveCustomers(customers);
  }

  addCar(customerId: string, input: AddCarInput): CustomerCar | null {
    const customers = [...this.getCustomers()];
    const index = customers.findIndex((customer) => customer.id === customerId);
    if (index < 0) {
      return null;
    }

    const car: CustomerCar = {
      id: this.createId(),
      plateNumber: input.plateNumber.trim().toUpperCase(),
      carType: input.carType.trim(),
      size: input.size,
      subscribedAt: new Date().toISOString()
    };

    customers[index] = {
      ...customers[index],
      cars: [...customers[index].cars, car]
    };
    this.saveCustomers(customers);
    return car;
  }

  deleteCar(customerId: string, carId: string): void {
    const customers = this.getCustomers().map((customer) => {
      if (customer.id !== customerId) {
        return customer;
      }
      return {
        ...customer,
        cars: customer.cars.filter((car) => car.id !== carId)
      };
    });
    this.saveCustomers(customers);
  }

  getSubscriberRows(monthOnly = false): SubscriberRow[] {
    const rows: SubscriberRow[] = [];

    for (const customer of this.getCustomers()) {
      const isNew = this.isNewCustomer(customer);

      if (!customer.cars.length) {
        if (!monthOnly || this.isInCurrentMonth(customer.createdAt)) {
          rows.push({
            customerId: customer.id,
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber,
            points: customer.points,
            createdAt: customer.createdAt,
            isNew,
            car: null
          });
        }
        continue;
      }

      for (const car of customer.cars) {
        if (monthOnly && !this.isInCurrentMonth(car.subscribedAt)) {
          continue;
        }

        rows.push({
          customerId: customer.id,
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          points: customer.points,
          createdAt: customer.createdAt,
          isNew,
          car
        });
      }
    }

    return rows.sort((a, b) => {
      const aDate = a.car?.subscribedAt ?? a.createdAt;
      const bDate = b.car?.subscribedAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }

  getFreeWashesForMonth(year: number, month: number): FreeWashRecord[] {
    return this.getTransactionsForMonth(year, month, true).map((transaction) => ({
      id: transaction.id,
      customerId: transaction.customerId,
      fullName: transaction.fullName,
      phoneNumber: transaction.phoneNumber,
      carId: transaction.carId ?? '',
      plateNumber: transaction.plateNumber ?? '',
      carType: transaction.carType ?? '',
      carSize: transaction.carSize ?? 'small',
      redeemedAt: transaction.createdAt
    }));
  }

  getTransactionsForMonth(
    year: number,
    month: number,
    freeWashOnly = false
  ): WashTransaction[] {
    return this.transactionsSubject.value
      .filter((record) => {
        const date = new Date(record.createdAt);
        const matchesMonth = date.getFullYear() === year && date.getMonth() + 1 === month;
        return matchesMonth && (!freeWashOnly || record.isFreeWash);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getMonthlySummary(
    year: number,
    month: number,
    freeWashOnly = false
  ): MonthlyActivitySummary {
    const records = this.getTransactionsForMonth(year, month, freeWashOnly);

    return records.reduce<MonthlyActivitySummary>(
      (summary, record) => {
        summary.totalCount += 1;
        summary.totalPrice += record.price;

        if (record.paymentMethod === 'cash') {
          summary.cashCount += 1;
        } else if (record.paymentMethod === 'card') {
          summary.cardCount += 1;
        }

        return summary;
      },
      { totalPrice: 0, cashCount: 0, cardCount: 0, totalCount: 0 }
    );
  }

  getServiceByPoints(points: number): WashServiceItem | undefined {
    return this.getServices().find((service) => service.points === points);
  }

  getFreeWashService(): WashServiceItem | undefined {
    return this.getServices().find((service) => service.points < 0);
  }

  recordWashTransaction(input: {
    customer: CustomerRecord;
    service: WashServiceItem;
    car?: CustomerCar | null;
    paymentMethod: PaymentMethod | null;
  }): WashTransaction {
    const isFreeWash = input.service.points < 0;
    const record: WashTransaction = {
      id: this.createId(),
      customerId: input.customer.id,
      fullName: input.customer.fullName,
      phoneNumber: input.customer.phoneNumber,
      serviceId: input.service.id,
      serviceNameEn: input.service.nameEn,
      serviceNameAr: input.service.nameAr,
      points: input.service.points,
      price: isFreeWash ? 0 : input.service.price,
      isFreeWash,
      paymentMethod: isFreeWash ? null : input.paymentMethod,
      carId: input.car?.id ?? null,
      plateNumber: input.car?.plateNumber ?? null,
      carType: input.car?.carType ?? null,
      carSize: input.car?.size ?? null,
      createdAt: new Date().toISOString()
    };

    const transactions = [record, ...this.transactionsSubject.value];
    this.persist(STORAGE_KEYS.transactions, transactions);
    this.transactionsSubject.next(transactions);

    if (isFreeWash && input.car) {
      this.syncLegacyFreeWash(record, input.customer, input.car);
    }

    return record;
  }

  recordFreeWash(
    customer: CustomerRecord,
    car: CustomerCar
  ): FreeWashRecord {
    const service = this.getFreeWashService();
    if (!service) {
      const legacy: FreeWashRecord = {
        id: this.createId(),
        customerId: customer.id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        carId: car.id,
        plateNumber: car.plateNumber,
        carType: car.carType,
        carSize: car.size,
        redeemedAt: new Date().toISOString()
      };

      const records = [legacy, ...this.freeWashesSubject.value];
      this.persist(STORAGE_KEYS.freeWashes, records);
      this.freeWashesSubject.next(records);
      return legacy;
    }

    const transaction = this.recordWashTransaction({
      customer,
      service,
      car,
      paymentMethod: null
    });

    return {
      id: transaction.id,
      customerId: transaction.customerId,
      fullName: transaction.fullName,
      phoneNumber: transaction.phoneNumber,
      carId: car.id,
      plateNumber: car.plateNumber,
      carType: car.carType,
      carSize: car.size,
      redeemedAt: transaction.createdAt
    };
  }

  getCustomerById(id: string): CustomerRecord | undefined {
    return this.getCustomers().find((customer) => customer.id === id);
  }

  private isNewCustomer(customer: CustomerRecord): boolean {
    if (!customer.cars.length) {
      return true;
    }
    return this.daysSince(customer.createdAt) <= NEW_CUSTOMER_DAYS;
  }

  private isInCurrentMonth(isoDate: string): boolean {
    const date = new Date(isoDate);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  private daysSince(isoDate: string): number {
    const diff = Date.now() - new Date(isoDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private loadAll(): void {
    const customers = this.readArray<CustomerRecord>(STORAGE_KEYS.customers);
    const freeWashes = this.readArray<FreeWashRecord>(STORAGE_KEYS.freeWashes);
    let transactions = this.readArray<WashTransaction>(STORAGE_KEYS.transactions);

    this.customersSubject.next(customers);

    if (!transactions.length && freeWashes.length) {
      transactions = this.migrateFreeWashesToTransactions(freeWashes);
      this.persist(STORAGE_KEYS.transactions, transactions);
    }

    this.transactionsSubject.next(transactions);
    this.freeWashesSubject.next(freeWashes);
  }

  private migrateFreeWashesToTransactions(freeWashes: FreeWashRecord[]): WashTransaction[] {
    const service = this.getFreeWashService() ?? {
      id: 0,
      nameEn: 'Free Wash',
      nameAr: 'غسلة مجانية',
      points: -250,
      price: 0
    };

    return freeWashes.map((record) => ({
      id: record.id,
      customerId: record.customerId,
      fullName: record.fullName,
      phoneNumber: record.phoneNumber,
      serviceId: service.id,
      serviceNameEn: service.nameEn,
      serviceNameAr: service.nameAr,
      points: service.points,
      price: 0,
      isFreeWash: true,
      paymentMethod: null,
      carId: record.carId,
      plateNumber: record.plateNumber,
      carType: record.carType,
      carSize: record.carSize,
      createdAt: record.redeemedAt
    }));
  }

  private syncLegacyFreeWash(
    transaction: WashTransaction,
    customer: CustomerRecord,
    car: CustomerCar
  ): void {
    const record: FreeWashRecord = {
      id: transaction.id,
      customerId: customer.id,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      carId: car.id,
      plateNumber: car.plateNumber,
      carType: car.carType,
      carSize: car.size,
      redeemedAt: transaction.createdAt
    };

    const records = [record, ...this.freeWashesSubject.value.filter((entry) => entry.id !== record.id)];
    this.persist(STORAGE_KEYS.freeWashes, records);
    this.freeWashesSubject.next(records);
  }

  private saveCustomers(customers: CustomerRecord[]): void {
    this.persist(STORAGE_KEYS.customers, customers);
    this.customersSubject.next(customers);
  }

  private readArray<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private persist<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

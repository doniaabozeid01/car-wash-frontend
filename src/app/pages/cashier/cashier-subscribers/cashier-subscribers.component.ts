import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SubscriberUser, UserCarRecord } from '../../../models/cashier.models';
import { CarsService } from '../../../services/cars.service';
import { LanguageService } from '../../../services/language.service';
import { UsersService } from '../../../services/users.service';

interface PeriodOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-cashier-subscribers',
  templateUrl: './cashier-subscribers.component.html',
  styleUrls: ['./cashier-subscribers.component.scss']
})
export class CashierSubscribersComponent implements OnInit, OnDestroy {
  users: SubscriberUser[] = [];
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  activeOnly = false;
  loading = false;
  loadError = '';
  expandedUserId: string | null = null;
  carsByUser: Record<string, UserCarRecord[]> = {};
  carsLoading: Record<string, boolean> = {};
  carsError: Record<string, string> = {};
  showCarModal = false;
  selectedUserId = '';
  selectedUserName = '';
  savingCar = false;
  deletingCarId: number | null = null;
  formError = '';
  carForm: FormGroup;
  months: PeriodOption[] = [];
  years: number[] = [];

  private langSub?: Subscription;

  constructor(
    private usersService: UsersService,
    private carsService: CarsService,
    private fb: FormBuilder,
    public language: LanguageService
  ) {
    this.carForm = this.fb.group({
      plateNumber: ['', Validators.required],
      carType: ['', Validators.required],
      size: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.buildPeriodOptions();
    this.langSub = this.language.language$.subscribe(() => this.buildPeriodOptions());
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  onFiltersChange(): void {
    this.expandedUserId = null;
    this.carsByUser = {};
    this.loadUsers();
  }

  toggleActiveOnly(): void {
    this.activeOnly = !this.activeOnly;
    this.onFiltersChange();
  }

  toggleUser(user: SubscriberUser): void {
    if (this.expandedUserId === user.id) {
      this.expandedUserId = null;
      return;
    }

    this.expandedUserId = user.id;
    this.loadCars(user.id);
  }

  isExpanded(userId: string): boolean {
    return this.expandedUserId === userId;
  }

  getCars(userId: string): UserCarRecord[] {
    return this.carsByUser[userId] ?? [];
  }

  isCarsLoading(userId: string): boolean {
    return !!this.carsLoading[userId];
  }

  sizeLabel(size: number): string {
    return size === 1 ? 'cashier.subscribers.sizeLarge' : 'cashier.subscribers.sizeSmall';
  }

  openAddCar(user: SubscriberUser): void {
    this.selectedUserId = user.id;
    this.selectedUserName = user.fullName;
    this.formError = '';
    this.carForm.reset({ plateNumber: '', carType: '', size: 0 });
    this.showCarModal = true;
  }

  closeCarModal(): void {
    this.showCarModal = false;
    this.selectedUserId = '';
    this.selectedUserName = '';
    this.formError = '';
    this.savingCar = false;
  }

  saveCar(): void {
    if (this.carForm.invalid || !this.selectedUserId || this.savingCar) {
      return;
    }

    this.savingCar = true;
    this.formError = '';

    const value = this.carForm.value;
    const userId = this.selectedUserId;
    this.carsService
      .create({
        userId,
        plateNumber: String(value.plateNumber).trim(),
        carType: String(value.carType).trim(),
        size: Number(value.size)
      })
      .subscribe({
        next: () => {
          this.savingCar = false;
          this.closeCarModal();
          this.expandedUserId = userId;
          this.loadCars(userId);
        },
        error: () => {
          this.savingCar = false;
          this.formError = 'cashier.subscribers.saveCarError';
        }
      });
  }

  deleteCar(userId: string, car: UserCarRecord): void {
    if (this.deletingCarId != null) {
      return;
    }

    this.deletingCarId = car.id;
    this.carsService.delete(car.id, userId).subscribe({
      next: () => {
        this.deletingCarId = null;
        this.loadCars(userId);
      },
      error: () => {
        this.deletingCarId = null;
        this.carsError[userId] = 'cashier.subscribers.deleteCarError';
      }
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

  private loadUsers(): void {
    this.loading = true;
    this.loadError = '';

    this.usersService.load(this.selectedYear, this.selectedMonth, this.activeOnly).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.users = [];
        this.loading = false;
        this.loadError = 'cashier.subscribers.loadError';
      }
    });
  }

  private loadCars(userId: string): void {
    this.carsLoading[userId] = true;
    this.carsError[userId] = '';

    this.carsService.loadByUser(userId).subscribe({
      next: (cars) => {
        this.carsByUser[userId] = cars;
        this.carsLoading[userId] = false;
      },
      error: () => {
        this.carsByUser[userId] = [];
        this.carsLoading[userId] = false;
        this.carsError[userId] = 'cashier.subscribers.carsLoadError';
      }
    });
  }
}

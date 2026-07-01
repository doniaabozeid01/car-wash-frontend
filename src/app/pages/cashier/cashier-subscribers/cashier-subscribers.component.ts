import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SubscriberUser, UserCarRecord } from '../../../models/cashier.models';
import { AuthService } from '../../../services/auth.service';
import { CarsService } from '../../../services/cars.service';
import { LanguageService } from '../../../services/language.service';
import { UsersService } from '../../../services/users.service';
import { CarSize, getCarSizeLabelKey, getCarSizeModifier } from '../../../utils/car-size';
import { buildDayOptions } from '../../../utils/period-filter.util';

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
  selectedMonth: number | null = new Date().getMonth() + 1;
  selectedDay: number | null = null;
  activeOnly = false;
  loading = false;
  loadError = '';
  expandedUserId: string | null = null;
  carsByUser: Record<string, UserCarRecord[]> = {};
  carsLoading: Record<string, boolean> = {};
  carsError: Record<string, string> = {};
  showCarModal = false;
  showCashierModal = false;
  selectedUserId = '';
  selectedUserName = '';
  savingCar = false;
  savingCashier = false;
  deletingCarId: number | null = null;
  deletingUserId: string | null = null;
  userDeleteError = '';
  currentPage = 1;
  readonly pageSize = 10;
  formError = '';
  cashierFormError = '';
  cashierFormSuccess = '';
  carForm: FormGroup;
  cashierForm: FormGroup;
  months: PeriodOption[] = [];
  years: number[] = [];

  private langSub?: Subscription;

  constructor(
    private usersService: UsersService,
    private carsService: CarsService,
    private auth: AuthService,
    private fb: FormBuilder,
    public language: LanguageService
  ) {
    this.carForm = this.fb.group({
      plateNumber: ['', Validators.required],
      carType: ['', Validators.required],
      size: [0, Validators.required]
    });
    this.cashierForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
    this.currentPage = 1;
    this.loadUsers();
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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.users.length / this.pageSize));
  }

  get paginatedUsers(): SubscriberUser[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    if (!this.users.length) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.users.length);
  }

  get showPagination(): boolean {
    return !this.loading && this.users.length > this.pageSize;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
    this.expandedUserId = null;
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
    return getCarSizeLabelKey(size, 'cashier.subscribers');
  }

  sizeModifier(size: number): 'small' | 'medium' | 'large' {
    return getCarSizeModifier(size);
  }

  readonly carSizes = [
    { value: CarSize.Small, labelKey: 'cashier.subscribers.sizeSmall' },
    { value: CarSize.Medium, labelKey: 'cashier.subscribers.sizeMedium' },
    { value: CarSize.Large, labelKey: 'cashier.subscribers.sizeLarge' }
  ];

  openAddCar(user: SubscriberUser): void {
    this.selectedUserId = user.id;
    this.selectedUserName = user.fullName;
    this.formError = '';
    this.carForm.reset({ plateNumber: '', carType: '', size: 0 });
    this.showCarModal = true;
  }

  openAddCashier(): void {
    this.cashierFormError = '';
    this.cashierFormSuccess = '';
    this.cashierForm.reset({ fullName: '', phone: '', password: '' });
    this.showCashierModal = true;
  }

  closeCashierModal(): void {
    this.showCashierModal = false;
    this.cashierFormError = '';
    this.cashierFormSuccess = '';
    this.savingCashier = false;
  }

  saveCashier(): void {
    if (this.cashierForm.invalid || this.savingCashier) {
      return;
    }

    this.savingCashier = true;
    this.cashierFormError = '';
    this.cashierFormSuccess = '';

    const { fullName, phone, password } = this.cashierForm.value;
    this.auth.register(fullName, phone, password, 'Cashier').subscribe({
      next: () => {
        this.savingCashier = false;
        this.cashierFormSuccess = 'cashier.subscribers.saveCashierSuccess';
        this.cashierForm.reset({ fullName: '', phone: '', password: '' });
      },
      error: () => {
        this.savingCashier = false;
        this.cashierFormError = 'cashier.subscribers.saveCashierError';
      }
    });
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

  deleteUser(user: SubscriberUser): void {
    if (this.deletingUserId != null) {
      return;
    }

    const confirmed = window.confirm(
      this.language.t('cashier.subscribers.deleteUserConfirm', { name: user.fullName })
    );
    if (!confirmed) {
      return;
    }

    this.deletingUserId = user.id;
    this.userDeleteError = '';

    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.deletingUserId = null;
        if (this.expandedUserId === user.id) {
          this.expandedUserId = null;
        }
        delete this.carsByUser[user.id];
        this.loadUsers();
      },
      error: () => {
        this.deletingUserId = null;
        this.userDeleteError = 'cashier.subscribers.deleteUserError';
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

    this.usersService
      .load(
        {
          year: this.selectedYear,
          month: this.selectedMonth,
          day: this.selectedDay
        },
        this.activeOnly
      )
      .subscribe({
        next: (users) => {
          this.users = users;
          if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
          }
          this.loading = false;
        },
        error: () => {
          this.users = [];
          this.currentPage = 1;
          this.loading = false;
          this.loadError = 'cashier.subscribers.loadError';
        }
      });
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

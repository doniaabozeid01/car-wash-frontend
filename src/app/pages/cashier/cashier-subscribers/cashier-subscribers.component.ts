import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CarSize, SubscriberRow } from '../../../models/cashier.models';
import { CashierStoreService } from '../../../services/cashier-store.service';

@Component({
  selector: 'app-cashier-subscribers',
  templateUrl: './cashier-subscribers.component.html',
  styleUrls: ['./cashier-subscribers.component.scss']
})
export class CashierSubscribersComponent implements OnInit, OnDestroy {
  rows: SubscriberRow[] = [];
  monthOnly = false;
  showCarModal = false;
  selectedCustomerId = '';
  selectedCustomerName = '';
  carForm: FormGroup;

  readonly sizeOptions: CarSize[] = ['small', 'large'];

  private sub?: Subscription;

  constructor(
    private store: CashierStoreService,
    private fb: FormBuilder
  ) {
    this.carForm = this.fb.group({
      plateNumber: ['', Validators.required],
      carType: ['', Validators.required],
      size: ['small' as CarSize, Validators.required]
    });
  }

  ngOnInit(): void {
    this.sub = this.store.customers$.subscribe(() => this.refreshRows());
    this.refreshRows();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleMonthFilter(): void {
    this.refreshRows();
  }

  openAddCar(row: SubscriberRow): void {
    this.selectedCustomerId = row.customerId;
    this.selectedCustomerName = row.fullName;
    this.carForm.reset({ plateNumber: '', carType: '', size: 'small' });
    this.showCarModal = true;
  }

  closeCarModal(): void {
    this.showCarModal = false;
    this.selectedCustomerId = '';
    this.selectedCustomerName = '';
  }

  saveCar(): void {
    if (this.carForm.invalid || !this.selectedCustomerId) {
      return;
    }

    this.store.addCar(this.selectedCustomerId, this.carForm.value);
    this.closeCarModal();
    this.refreshRows();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
  }

  private refreshRows(): void {
    this.rows = this.store.getSubscriberRows(this.monthOnly);
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WashServiceItem } from '../../../models/cashier.models';
import { LanguageService } from '../../../services/language.service';
import { WashServicesService } from '../../../services/wash-services.service';

@Component({
  selector: 'app-cashier-services',
  templateUrl: './cashier-services.component.html',
  styleUrls: ['./cashier-services.component.scss']
})
export class CashierServicesComponent implements OnInit, OnDestroy {
  services: WashServiceItem[] = [];
  showForm = false;
  editingId: number | null = null;
  loading = false;
  saving = false;
  loadError = '';
  formError = '';
  serviceForm: FormGroup;

  private sub?: Subscription;

  constructor(
    private washServices: WashServicesService,
    private fb: FormBuilder,
    public language: LanguageService
  ) {
    this.serviceForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      points: [30, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.sub = this.washServices.services$.subscribe((services) => {
      this.services = services;
    });
    this.reload();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  serviceName(service: WashServiceItem): string {
    const name = this.language.current === 'ar' ? service.nameAr : service.nameEn;
    return name || service.nameAr || service.nameEn;
  }

  reload(): void {
    this.loading = true;
    this.loadError = '';
    this.washServices.load().subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = 'cashier.services.loadError';
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.formError = '';
    this.serviceForm.reset({ nameEn: '', nameAr: '', points: 30 });
    this.showForm = true;
  }

  openEdit(service: WashServiceItem): void {
    this.editingId = service.id;
    this.formError = '';
    this.serviceForm.patchValue({
      nameEn: service.nameEn,
      nameAr: service.nameAr,
      points: service.points
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formError = '';
  }

  saveService(): void {
    if (this.serviceForm.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.formError = '';
    const value = this.serviceForm.value;
    const request$ = this.editingId
      ? this.washServices.update(this.editingId, value)
      : this.washServices.create(value);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelForm();
      },
      error: () => {
        this.saving = false;
        this.formError = 'cashier.services.saveError';
      }
    });
  }

  deleteService(id: number): void {
    if (this.saving) {
      return;
    }

    this.saving = true;
    this.washServices.delete(id).subscribe({
      next: () => {
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        this.loadError = 'cashier.services.deleteError';
      }
    });
  }
}

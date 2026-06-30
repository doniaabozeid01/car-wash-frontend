import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { PaymentMethod, WashServiceItem } from '../../../models/cashier.models';
import {
  API_PAYMENT_METHOD,
  ApplyPointsRequest,
  ScannedCar,
  ScannedCustomer
} from '../../../models/points.models';
import { LanguageService } from '../../../services/language.service';
import { PointsService } from '../../../services/points.service';
import { WashServicesService } from '../../../services/wash-services.service';
import {
  buildPointsAddedWhatsAppMessage,
  openWhatsAppChat
} from '../../../utils/whatsapp.util';

type CheckoutStep = 'car' | 'service' | 'payment';

@Component({
  selector: 'app-cashier-scan',
  templateUrl: './cashier-scan.component.html',
  styleUrls: ['./cashier-scan.component.scss']
})
export class CashierScanComponent implements AfterViewInit, OnDestroy {
  private static readonly SCANNER_ELEMENT_ID = 'cashier-qr-reader';

  scannerActive = false;
  scannerLoading = true;
  scannerError = '';
  scannedQrCode = '';
  scannedCustomer: ScannedCustomer | null = null;
  scannedCars: ScannedCar[] = [];
  availableServices: WashServiceItem[] = [];
  selectedCarId: number | null = null;
  selectedServiceId: number | null = null;
  amountPaid: number | null = null;
  checkoutStep: CheckoutStep = 'car';
  scanTime = '';
  showCheckout = false;
  scanValidating = false;
  actionLoading = false;
  showSuccess = false;
  actionMessage = '';
  actionMessageParams: Record<string, string | number> = {};
  actionError = false;
  paymentMethod: PaymentMethod = 'cash';
  pointsAdded = 0;
  customerPhone = '';
  showWhatsAppAction = false;

  private scanner: Html5Qrcode | null = null;
  private scanLock = false;
  private viewReady = false;
  private startingScanner = false;

  constructor(
    private points: PointsService,
    private washServicesService: WashServicesService,
    public language: LanguageService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.washServicesService.load().subscribe({
      next: (services) => {
        this.availableServices = services;
        this.cdr.detectChanges();
      }
    });
    void this.startScanner();
  }

  ngOnDestroy(): void {
    void this.stopScanner();
  }

  get scannedMemberId(): string {
    return this.scannedCustomer?.id?.slice(0, 8) ?? '';
  }

  get selectedCar(): ScannedCar | undefined {
    return this.scannedCars.find((car) => car.id === this.selectedCarId);
  }

  get selectedService(): WashServiceItem | undefined {
    return this.availableServices.find((service) => service.id === this.selectedServiceId);
  }

  get requiresPayment(): boolean {
    return (this.selectedService?.points ?? 0) >= 0;
  }

  retryScanner(): void {
    void this.restartScanner();
  }

  selectCar(carId: number): void {
    this.selectedCarId = carId;
    this.actionError = false;
    this.actionMessage = '';
  }

  selectService(serviceId: number): void {
    this.selectedServiceId = serviceId;
    this.actionError = false;
    this.actionMessage = '';

    const service = this.availableServices.find((item) => item.id === serviceId);
    if ((service?.points ?? 0) < 0) {
      this.amountPaid = 0;
    }
  }

  goToStep(step: CheckoutStep): void {
    this.checkoutStep = step;
    this.actionError = false;
    this.actionMessage = '';
  }

  nextFromCar(): void {
    if (!this.selectedCarId) {
      this.setCheckoutError('cashier.errorSelectCar');
      return;
    }

    this.goToStep('service');
  }

  nextFromService(): void {
    if (!this.selectedServiceId) {
      this.setCheckoutError('cashier.errorSelectService');
      return;
    }

    if (this.requiresPayment) {
      this.goToStep('payment');
      return;
    }

    this.submitTransaction();
  }

  submitTransaction(): void {
    if (!this.scannedQrCode || this.actionLoading || !this.scannedCustomer) {
      return;
    }

    if (!this.selectedCarId) {
      this.setCheckoutError('cashier.errorSelectCar');
      return;
    }

    if (!this.selectedServiceId) {
      this.setCheckoutError('cashier.errorSelectService');
      return;
    }

    if (this.requiresPayment) {
      const amount = Number(this.amountPaid);
      if (!Number.isFinite(amount) || amount < 0) {
        this.setCheckoutError('cashier.errorEnterPrice');
        return;
      }
    }

    this.actionLoading = true;
    this.actionError = false;
    this.actionMessage = '';

    const body: ApplyPointsRequest = {
      qrCode: this.scannedQrCode,
      serviceId: this.selectedServiceId,
      carId: this.selectedCarId
    };

    if (this.requiresPayment) {
      body.amountPaid = Number(this.amountPaid);
      body.paymentMethod =
        this.paymentMethod === 'cash' ? API_PAYMENT_METHOD.cash : API_PAYMENT_METHOD.network;
    }

    this.points.applyTransaction(body).subscribe({
      next: (result) => {
        const updatedCar = result.cars.find((car) => car.id === this.selectedCarId);
        const pointsAdded = this.selectedService?.points ?? 0;
        this.actionLoading = false;
        this.showCheckout = false;
        this.showSuccess = true;
        this.scanLock = false;
        this.scannedCustomer = result;
        this.scannedCars = result.cars;
        this.actionError = false;
        this.actionMessage = 'cashier.successTransaction';
        this.actionMessageParams = {
          name: result.fullName,
          points: updatedCar?.points ?? 0
        };
        this.pointsAdded = pointsAdded > 0 ? pointsAdded : 0;
        this.customerPhone = result.phoneNumber;
        this.showWhatsAppAction = this.pointsAdded > 0 && !!result.phoneNumber;

        if (this.showWhatsAppAction) {
          this.sendPointsWhatsApp(result.phoneNumber, this.pointsAdded);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = true;

        const apiMessage = err?.error?.title || err?.error?.message || err?.error;
        if (typeof apiMessage === 'string' && apiMessage.trim()) {
          this.actionMessage = apiMessage;
          this.actionMessageParams = {};
        } else {
          this.actionMessage = 'cashier.errorApplyFailed';
          this.actionMessageParams = {};
        }

        this.cdr.detectChanges();
      }
    });
  }

  serviceName(service: WashServiceItem): string {
    const name = this.language.current === 'ar' ? service.nameAr : service.nameEn;
    return name || service.nameAr || service.nameEn;
  }

  servicePointsLabel(service: WashServiceItem): string {
    const prefix = service.points > 0 ? '+' : '';
    return `${prefix}${service.points}`;
  }

  sendPointsWhatsApp(phone = this.customerPhone, points = this.pointsAdded): void {
    if (!phone || points <= 0) {
      return;
    }

    openWhatsAppChat(phone, buildPointsAddedWhatsAppMessage(points));
  }

  clearScan(): void {
    this.updateState({
      scannedQrCode: '',
      scannedCustomer: null,
      scannedCars: [],
      selectedCarId: null,
      selectedServiceId: null,
      amountPaid: null,
      checkoutStep: 'car',
      scanTime: '',
      showCheckout: false,
      showSuccess: false,
      scanValidating: false,
      actionLoading: false,
      actionMessage: '',
      actionMessageParams: {},
      actionError: false,
      paymentMethod: 'cash',
      pointsAdded: 0,
      customerPhone: '',
      showWhatsAppAction: false,
      scannerLoading: true
    });
    this.scanLock = false;
    void this.startScanner();
  }

  private setCheckoutError(messageKey: string): void {
    this.actionError = true;
    this.actionMessage = messageKey;
    this.actionMessageParams = {};
    this.cdr.detectChanges();
  }

  private async restartScanner(): Promise<void> {
    await this.stopScanner();
    this.updateState({
      scannerError: '',
      scannerLoading: true,
      showCheckout: false,
      showSuccess: false,
      scannedQrCode: '',
      scannedCustomer: null,
      scannedCars: [],
      selectedCarId: null,
      selectedServiceId: null,
      amountPaid: null,
      checkoutStep: 'car',
      scanValidating: false,
      actionLoading: false,
      actionMessage: '',
      actionMessageParams: {},
      actionError: false
    });
    this.scanLock = false;
    await this.startScanner();
  }

  private async startScanner(): Promise<void> {
    if (
      !this.viewReady ||
      this.startingScanner ||
      this.scanner?.isScanning ||
      this.showCheckout ||
      this.showSuccess
    ) {
      return;
    }

    this.startingScanner = true;
    this.updateState({ scannerLoading: true, scannerError: '' });

    try {
      if (!window.isSecureContext) {
        throw new Error('HTTPS_REQUIRED');
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('NOT_SUPPORTED');
      }

      await this.waitForScannerElement();

      const element = document.getElementById(CashierScanComponent.SCANNER_ELEMENT_ID);
      if (!element) {
        throw new Error('ELEMENT_MISSING');
      }

      await this.requestCameraPermission();
      await this.stopScanner();

      this.scanner = new Html5Qrcode(CashierScanComponent.SCANNER_ELEMENT_ID, false);
      const scanConfig: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
          return { width: size, height: size };
        },
        aspectRatio: 1.777778,
        disableFlip: false
      };

      const cameraId = await this.resolveRearCameraId();
      const cameraConfigs: Array<string | { facingMode: string }> = [{ facingMode: 'environment' }];
      if (cameraId) {
        cameraConfigs.push(cameraId);
      }
      cameraConfigs.push({ facingMode: 'user' });

      let started = false;
      let lastError = '';

      for (const camera of cameraConfigs) {
        try {
          await this.scanner.start(
            camera,
            scanConfig,
            (decodedText) => this.onScanSuccess(decodedText),
            () => undefined
          );
          started = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'CAMERA_FAILED';
          await this.stopScanner();
          this.scanner = new Html5Qrcode(CashierScanComponent.SCANNER_ELEMENT_ID, false);
        }
      }

      if (!started) {
        throw new Error(lastError || 'CAMERA_FAILED');
      }

      this.updateState({
        scannerActive: true,
        scannerLoading: false,
        scannerError: ''
      });
    } catch (error) {
      this.updateState({
        scannerActive: false,
        scannerLoading: false,
        scannerError: this.mapScannerError(error)
      });
    } finally {
      this.startingScanner = false;
    }
  }

  private onScanSuccess(decodedText: string): void {
    if (this.scanLock || this.showCheckout || this.showSuccess || this.scanValidating) {
      return;
    }

    this.ngZone.run(() => {
      this.scanLock = true;
      this.scannedQrCode = decodedText.trim();
      this.scanValidating = true;
      this.scanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.actionMessage = '';
      this.actionMessageParams = {};
      this.actionError = false;
      this.checkoutStep = 'car';
      this.selectedCarId = null;
      this.selectedServiceId = null;
      this.amountPaid = null;
      this.paymentMethod = 'cash';
      this.scannerActive = false;
      this.cdr.detectChanges();
    });

    void this.stopScanner();

    this.points.scanQrCode(decodedText).subscribe({
      next: (customer) => {
        this.ngZone.run(() => {
          this.scannedCustomer = customer;
          this.scannedCars = customer.cars;
          this.selectedCarId = customer.cars.length === 1 ? customer.cars[0].id : null;
          this.scanValidating = false;
          this.showCheckout = true;

          if (!this.availableServices.length) {
            this.washServicesService.load().subscribe({
              next: (services) => {
                this.availableServices = services;
                this.cdr.detectChanges();
              }
            });
          }

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.scanValidating = false;
          this.scanLock = false;
          this.actionError = true;

          const apiMessage = err?.error?.title || err?.error?.message || err?.error;
          this.actionMessage =
            typeof apiMessage === 'string' && apiMessage.trim()
              ? apiMessage
              : 'cashier.errorScanFailed';
          this.actionMessageParams = {};
          this.scannedQrCode = '';
          this.cdr.detectChanges();
          void this.startScanner();
        });
      }
    });
  }

  private async requestCameraPermission(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    stream.getTracks().forEach((track) => track.stop());
  }

  private async resolveRearCameraId(): Promise<string> {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) {
      return '';
    }

    const rearCamera = cameras.find((camera) =>
      /back|rear|environment|خلف/i.test(camera.label)
    );

    return rearCamera?.id ?? cameras[cameras.length - 1]?.id ?? '';
  }

  private mapScannerError(error: unknown): string {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'cashier.errorPermission';
    }

    const code = error instanceof Error ? error.message : 'CAMERA_FAILED';

    if (code === 'HTTPS_REQUIRED') {
      return 'cashier.errorHttps';
    }

    if (code === 'NOT_SUPPORTED') {
      return 'cashier.errorNotSupported';
    }

    if (code === 'ELEMENT_MISSING') {
      return 'cashier.errorElementMissing';
    }

    if (/NotAllowedError|Permission/i.test(code)) {
      return 'cashier.errorPermission';
    }

    return 'cashier.errorGeneric';
  }

  private waitForScannerElement(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  private async stopScanner(): Promise<void> {
    if (!this.scanner) {
      return;
    }

    try {
      if (this.scanner.isScanning) {
        await this.scanner.stop();
      }
      await this.scanner.clear();
    } catch {
      // Scanner may already be stopped during navigation.
    }

    this.scanner = null;
    this.scannerActive = false;
  }

  private updateState(partial: Partial<CashierScanComponent>): void {
    Object.assign(this, partial);
    this.cdr.detectChanges();
  }
}

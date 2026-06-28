import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { UserProfile } from '../../models/auth.models';
import { PointsActionType, ScannedCustomer } from '../../models/points.models';
import { AuthService } from '../../services/auth.service';
import { PointsService } from '../../services/points.service';

export type ScanAction = 'add30' | 'add50' | 'freeWash';

const SCAN_ACTION_TO_API: Record<ScanAction, PointsActionType> = {
  add30: PointsActionType.Add30,
  add50: PointsActionType.Add50,
  freeWash: PointsActionType.Subtract250
};

@Component({
  selector: 'app-cashier',
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss']
})
export class CashierComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly SCANNER_ELEMENT_ID = 'cashier-qr-reader';

  cashier: UserProfile | null = null;
  scannerActive = false;
  scannerLoading = true;
  scannerError = '';
  scannedQrCode = '';
  scannedCustomer: ScannedCustomer | null = null;
  scanTime = '';
  showActions = false;
  scanValidating = false;
  actionLoading = false;
  actionMessage = '';
  actionMessageParams: Record<string, string | number> = {};
  actionError = false;

  private scanner: Html5Qrcode | null = null;
  private scanLock = false;
  private viewReady = false;
  private startingScanner = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private points: PointsService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cashier = this.auth.getUser();
    if (!this.cashier || this.cashier.role !== 'cashier' || !this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.cashier) {
      void this.startScanner();
    }
  }

  ngOnDestroy(): void {
    void this.stopScanner();
  }

  get scannedMemberId(): string {
    return this.scannedCustomer?.id?.slice(0, 8) ?? '';
  }

  async logout(): Promise<void> {
    await this.stopScanner();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  retryScanner(): void {
    void this.restartScanner();
  }

  applyAction(action: ScanAction): void {
    if (!this.scannedQrCode || this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    this.actionError = false;
    this.actionMessage = '';

    this.points.applyAction(this.scannedQrCode, SCAN_ACTION_TO_API[action]).subscribe({
      next: (result) => {
        this.actionLoading = false;
        this.showActions = false;
        this.scanLock = false;

        if (this.scannedCustomer) {
          this.scannedCustomer = { ...this.scannedCustomer, points: result.points };
        }

        if (action === 'add30') {
          this.actionMessage = 'cashier.successAdd30';
        } else if (action === 'add50') {
          this.actionMessage = 'cashier.successAdd50';
        } else {
          this.actionMessage = 'cashier.successFreeWash';
        }

        this.actionMessageParams = { points: result.points };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = true;

        const apiMessage = err?.error?.title || err?.error?.message || err?.error;
        if (typeof apiMessage === 'string' && apiMessage.trim()) {
          this.actionMessage = apiMessage;
          this.actionMessageParams = {};
        } else if (action === 'freeWash') {
          this.actionMessage = 'cashier.errorInsufficientPoints';
          this.actionMessageParams = {
            current: this.scannedCustomer?.points ?? 0,
            goal: 250
          };
        } else {
          this.actionMessage = 'cashier.errorApplyFailed';
          this.actionMessageParams = {};
        }

        this.cdr.detectChanges();
      }
    });
  }

  clearScan(): void {
    this.updateState({
      scannedQrCode: '',
      scannedCustomer: null,
      scanTime: '',
      showActions: false,
      scanValidating: false,
      actionLoading: false,
      actionMessage: '',
      actionMessageParams: {},
      actionError: false,
      scannerLoading: true
    });
    this.scanLock = false;
    void this.startScanner();
  }

  private async restartScanner(): Promise<void> {
    await this.stopScanner();
    this.updateState({
      scannerError: '',
      scannerLoading: true,
      showActions: false,
      scannedQrCode: '',
      scannedCustomer: null,
      scanValidating: false,
      actionLoading: false
    });
    this.scanLock = false;
    await this.startScanner();
  }

  private async startScanner(): Promise<void> {
    if (!this.viewReady || this.startingScanner || this.scanner?.isScanning || this.showActions) {
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

      const element = document.getElementById(CashierComponent.SCANNER_ELEMENT_ID);
      if (!element) {
        throw new Error('ELEMENT_MISSING');
      }

      await this.requestCameraPermission();
      await this.stopScanner();

      this.scanner = new Html5Qrcode(CashierComponent.SCANNER_ELEMENT_ID, false);
      const scanConfig: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
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
          this.scanner = new Html5Qrcode(CashierComponent.SCANNER_ELEMENT_ID, false);
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
    if (this.scanLock || this.showActions || this.scanValidating) {
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
      this.scannerActive = false;
      this.cdr.detectChanges();
    });

    void this.stopScanner();

    this.points.scanQrCode(decodedText).subscribe({
      next: (customer) => {
        this.ngZone.run(() => {
          this.scannedCustomer = customer;
          this.scanValidating = false;
          this.showActions = true;
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

  private updateState(partial: Partial<Pick<CashierComponent,
    'scannerActive' | 'scannerLoading' | 'scannerError' | 'scannedQrCode' |
    'scannedCustomer' | 'scanTime' | 'showActions' | 'scanValidating' | 'actionLoading' |
    'actionMessage' | 'actionMessageParams' | 'actionError'
  >>): void {
    Object.assign(this, partial);
    this.cdr.detectChanges();
  }
}

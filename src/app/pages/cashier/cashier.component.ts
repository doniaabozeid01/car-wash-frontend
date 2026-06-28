import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { AuthAccount, AuthService } from '../../services/auth.service';
import { RewardsService } from '../../services/rewards.service';

export type ScanAction = 'add30' | 'add50' | 'freeWash';

@Component({
  selector: 'app-cashier',
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss']
})
export class CashierComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly SCANNER_ELEMENT_ID = 'cashier-qr-reader';

  cashier: AuthAccount | null = null;
  scannerActive = false;
  scannerLoading = true;
  scannerError = '';
  lastScan = '';
  scannedMemberId = '';
  scanTime = '';
  showActions = false;
  actionMessage = '';
  actionError = false;

  private scanner: Html5Qrcode | null = null;
  private scanLock = false;
  private viewReady = false;
  private startingScanner = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private rewards: RewardsService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cashier = this.auth.getUser();
    if (!this.cashier || this.cashier.role !== 'cashier') {
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

  async logout(): Promise<void> {
    await this.stopScanner();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  retryScanner(): void {
    void this.restartScanner();
  }

  private async restartScanner(): Promise<void> {
    await this.stopScanner();
    this.updateState({
      scannerError: '',
      scannerLoading: true,
      showActions: false,
      lastScan: '',
      scannedMemberId: ''
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
      return 'تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم اضغط إعادة المحاولة.';
    }

    const code = error instanceof Error ? error.message : 'CAMERA_FAILED';

    if (code === 'HTTPS_REQUIRED') {
      return 'الكاميرا تحتاج اتصال آمن (HTTPS). افتح الموقع عبر https أو localhost.';
    }

    if (code === 'NOT_SUPPORTED') {
      return 'المتصفح لا يدعم الكاميرا. جرّب Chrome أو Safari على الموبايل.';
    }

    if (code === 'ELEMENT_MISSING') {
      return 'تعذّر تحميل الماسح. اضغط إعادة المحاولة.';
    }

    if (/NotAllowedError|Permission/i.test(code)) {
      return 'تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم اضغط إعادة المحاولة.';
    }

    return 'تعذّر فتح الكاميرا. تأكد من الإذن ثم اضغط إعادة المحاولة.';
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

  private onScanSuccess(decodedText: string): void {
    if (this.scanLock || this.showActions) {
      return;
    }

    this.ngZone.run(() => {
      this.scanLock = true;
      this.lastScan = decodedText;
      this.scannedMemberId = this.extractMemberId(decodedText);
      this.scanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.showActions = true;
      this.actionMessage = '';
      this.actionError = false;
      this.scannerActive = false;
      this.cdr.detectChanges();
    });

    void this.stopScanner();
  }

  applyAction(action: ScanAction): void {
    const memberId = this.scannedMemberId || this.extractMemberId(this.lastScan);
    this.actionError = false;

    if (action === 'add30') {
      const points = this.rewards.addPoints(30, memberId);
      this.actionMessage = `تمت إضافة 30 نقطة. رصيد العميل الآن ${points} نقطة.`;
    } else if (action === 'add50') {
      const points = this.rewards.addPoints(50, memberId);
      this.actionMessage = `تمت إضافة 50 نقطة. رصيد العميل الآن ${points} نقطة.`;
    } else {
      const result = this.rewards.redeemFreeWash(memberId);
      if (result.success) {
        this.actionMessage = `تم استبدال غسلة مجانية. رصيد العميل الآن ${result.points} نقطة.`;
      } else {
        this.actionError = true;
        this.actionMessage = `النقاط غير كافية للغسلة المجانية (${result.points} / ${this.rewards.getFreeWashGoal()}).`;
        return;
      }
    }

    this.showActions = false;
    this.scanLock = false;
    void this.startScanner();
  }

  clearScan(): void {
    this.updateState({
      lastScan: '',
      scannedMemberId: '',
      scanTime: '',
      showActions: false,
      actionMessage: '',
      actionError: false,
      scannerLoading: true
    });
    this.scanLock = false;
    void this.startScanner();
  }

  private extractMemberId(scanText: string): string {
    const match = scanText.match(/(\d{3}-\d{3})/);
    return match ? match[1] : '772-910';
  }

  private updateState(partial: Partial<Pick<CashierComponent,
    'scannerActive' | 'scannerLoading' | 'scannerError' | 'lastScan' |
    'scannedMemberId' | 'scanTime' | 'showActions' | 'actionMessage' | 'actionError'
  >>): void {
    Object.assign(this, partial);
    this.cdr.detectChanges();
  }
}

import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
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
  scanTime = '';
  scanCount = 0;
  showActions = false;
  actionMessage = '';
  actionError = false;

  private scanner: Html5Qrcode | null = null;
  private scanLock = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private rewards: RewardsService
  ) {}

  ngOnInit(): void {
    this.cashier = this.auth.getUser();
    if (!this.cashier || this.cashier.role !== 'cashier') {
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit(): void {
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
    this.scannerError = '';
    this.scannerLoading = true;
    await this.startScanner();
  }

  private async startScanner(): Promise<void> {
    if (this.scanner) {
      return;
    }

    this.scanner = new Html5Qrcode(CashierComponent.SCANNER_ELEMENT_ID);
    const configs = [
      { facingMode: 'environment' },
      { facingMode: 'user' }
    ];

    for (const camera of configs) {
      try {
        await this.scanner.start(
          camera,
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.68;
              return { width: size, height: size };
            },
            aspectRatio: 1
          },
          (decodedText) => this.onScanSuccess(decodedText),
          () => undefined
        );
        this.scannerActive = true;
        this.scannerError = '';
        this.scannerLoading = false;
        return;
      } catch {
        await this.stopScanner();
        this.scanner = new Html5Qrcode(CashierComponent.SCANNER_ELEMENT_ID);
      }
    }

    this.scannerActive = false;
    this.scannerLoading = false;
    this.scannerError = 'Camera access denied. Allow permission in your browser, then tap Retry.';
  }

  private async stopScanner(): Promise<void> {
    if (!this.scanner) {
      return;
    }

    try {
      if (this.scanner.isScanning) {
        await this.scanner.stop();
      }
      this.scanner.clear();
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

    this.scanLock = true;
    this.lastScan = decodedText;
    this.scanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.scanCount += 1;
    this.showActions = true;
    this.actionMessage = '';
    this.actionError = false;
    void this.stopScanner();
  }

  applyAction(action: ScanAction): void {
    const memberId = this.extractMemberId(this.lastScan);
    this.actionError = false;

    if (action === 'add30') {
      const points = this.rewards.addPoints(30, memberId);
      this.actionMessage = `+30 points applied. Customer now has ${points} pts.`;
    } else if (action === 'add50') {
      const points = this.rewards.addPoints(50, memberId);
      this.actionMessage = `+50 points applied. Customer now has ${points} pts.`;
    } else {
      const result = this.rewards.redeemFreeWash(memberId);
      if (result.success) {
        this.actionMessage = `Free wash redeemed. Customer now has ${result.points} pts.`;
      } else {
        this.actionError = true;
        this.actionMessage = `Not enough points for free wash (${result.points} / ${this.rewards.getFreeWashGoal()}).`;
        return;
      }
    }

    this.showActions = false;
    this.scanLock = false;
    void this.startScanner();
  }

  clearScan(): void {
    this.lastScan = '';
    this.scanTime = '';
    this.showActions = false;
    this.actionMessage = '';
    this.actionError = false;
    this.scanLock = false;
    if (!this.scannerActive && !this.scannerLoading) {
      void this.startScanner();
    }
  }

  private extractMemberId(scanText: string): string {
    const match = scanText.match(/(\d{3}-\d{3})/);
    return match ? match[1] : '772-910';
  }
}

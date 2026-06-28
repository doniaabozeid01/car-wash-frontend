import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
import { PointsHubService } from '../../services/points-hub.service';
import { RewardsService } from '../../services/rewards.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  memberPoints = 0;
  freeWashGoal = 250;
  progressPercent = 0;
  pointsRemaining = 0;
  userName = '';
  memberId = '';
  qrCodeUrl = '';
  profileLoading = true;

  private hubSub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private rewards: RewardsService,
    private pointsHub: PointsHubService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.freeWashGoal = this.rewards.getFreeWashGoal();

    this.auth.fetchProfile().subscribe({
      next: (profile) => {
        if (profile.role !== 'user') {
          this.router.navigate(['/login']);
          return;
        }
        this.bindProfile(profile);
        this.profileLoading = false;
        void this.startPointsHub(profile.id);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.hubSub?.unsubscribe();
    void this.pointsHub.disconnect();
  }

  logout(): void {
    void this.pointsHub.disconnect();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private bindProfile(profile: UserProfile): void {
    this.userName = profile.fullName;
    this.memberId = profile.id;
    this.qrCodeUrl = this.auth.getQrCodeDataUrl(profile);
    this.memberPoints = profile.points;
    this.updateProgress();
  }

  private async startPointsHub(memberId: string): Promise<void> {
    this.hubSub?.unsubscribe();
    this.hubSub = this.pointsHub.pointsUpdated$.subscribe((data) => {
      this.memberPoints = data.points;
      this.rewards.syncPoints(data.points, memberId);
      this.auth.updateStoredPoints(data.points);
      this.updateProgress();
    });

    try {
      await this.pointsHub.connect();
    } catch {
      // Profile still works; points refresh on next page load.
    }
  }

  private updateProgress(): void {
    this.progressPercent = Math.min(100, (this.memberPoints / this.freeWashGoal) * 100);
    this.pointsRemaining = Math.max(0, this.freeWashGoal - this.memberPoints);
  }
}

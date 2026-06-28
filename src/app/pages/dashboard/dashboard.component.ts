import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
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

  private pointsSub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private rewards: RewardsService
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
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.pointsSub?.unsubscribe();
  }

  private bindProfile(profile: UserProfile): void {
    this.userName = profile.fullName;
    this.memberId = profile.id;
    this.qrCodeUrl = this.auth.getQrCodeDataUrl(profile);
    this.memberPoints = profile.points;
    this.updateProgress();

    this.pointsSub?.unsubscribe();
    this.pointsSub = this.rewards.pointsChanged$.subscribe((id) => {
      if (id === profile.id) {
        this.memberPoints = this.rewards.getPoints(profile.id);
        this.updateProgress();
      }
    });
  }

  private updateProgress(): void {
    this.progressPercent = Math.min(100, (this.memberPoints / this.freeWashGoal) * 100);
    this.pointsRemaining = Math.max(0, this.freeWashGoal - this.memberPoints);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

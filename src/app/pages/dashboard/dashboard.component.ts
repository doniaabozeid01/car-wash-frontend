import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserCar, UserProfile } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
import { PointsHubService } from '../../services/points-hub.service';
import { RewardsService } from '../../services/rewards.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  cars: UserCar[] = [];
  memberPoints = 0;
  freeWashGoal = 250;
  userName = '';
  userPhone = '';
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
    this.loadProfile();
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

  carProgress(car: UserCar): number {
    return Math.min(100, (car.points / this.freeWashGoal) * 100);
  }

  carPointsRemaining(car: UserCar): number {
    return Math.max(0, this.freeWashGoal - car.points);
  }

  isCarReady(car: UserCar): boolean {
    return car.points >= this.freeWashGoal;
  }

  isLargeCar(car: UserCar): boolean {
    return car.size === 1;
  }

  private loadProfile(): void {
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

  private bindProfile(profile: UserProfile): void {
    this.userName = profile.fullName;
    this.userPhone = profile.phoneNumber;
    this.memberId = profile.id;
    this.qrCodeUrl = this.auth.getQrCodeDataUrl(profile);
    this.cars = profile.cars;
    this.memberPoints = profile.points;
  }

  private async startPointsHub(memberId: string): Promise<void> {
    this.hubSub?.unsubscribe();
    this.hubSub = this.pointsHub.pointsUpdated$.subscribe(() => {
      this.auth.fetchProfile().subscribe({
        next: (profile) => {
          this.bindProfile(profile);
          this.rewards.syncPoints(profile.points, memberId);
        }
      });
    });

    try {
      await this.pointsHub.connect();
    } catch {
      // Profile still works; points refresh on next page load.
    }
  }
}

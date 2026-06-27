import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RewardsService } from '../../services/rewards.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  memberPoints = 180;
  freeWashGoal = 250;
  progressPercent = 0;
  pointsRemaining = 0;
  userName = 'Alexander';

  private pointsSub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private rewards: RewardsService
  ) {}

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (!user || user.role !== 'user') {
      this.router.navigate(['/login']);
      return;
    }
    this.userName = user.name;
    this.freeWashGoal = this.rewards.getFreeWashGoal();
    this.refreshPoints();
    this.pointsSub = this.rewards.pointsChanged$.subscribe(() => this.refreshPoints());
  }

  ngOnDestroy(): void {
    this.pointsSub?.unsubscribe();
  }

  private refreshPoints(): void {
    this.memberPoints = this.rewards.getPoints();
    this.progressPercent = Math.min(100, (this.memberPoints / this.freeWashGoal) * 100);
    this.pointsRemaining = Math.max(0, this.freeWashGoal - this.memberPoints);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

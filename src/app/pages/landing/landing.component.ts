import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  private static readonly LOAD_MS = 3000;
  private static readonly PAUSE_MS = 400;
  private static readonly EXIT_MS = 850;

  exiting = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      const user = this.auth.getUser();
      if (user) {
        void this.router.navigate([this.auth.getRouteForRole(user.role)]);
        return;
      }
    }

    this.schedule(() => {
      this.exiting = true;
      this.schedule(() => this.goToLogin(), LandingComponent.EXIT_MS);
    }, LandingComponent.LOAD_MS + LandingComponent.PAUSE_MS);
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  private schedule(fn: () => void, delay: number): void {
    this.timers.push(setTimeout(fn, delay));
  }

  private goToLogin(): void {
    this.router.navigate(['/login'], { state: { fromSplash: true } });
  }
}

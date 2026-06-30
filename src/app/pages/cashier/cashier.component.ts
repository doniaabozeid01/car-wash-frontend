import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfile } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
import { WashServicesService } from '../../services/wash-services.service';

@Component({
  selector: 'app-cashier',
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss']
})
export class CashierComponent implements OnInit {
  cashier: UserProfile | null = null;

  readonly navItems = [
    { path: '/cashier/scan', labelKey: 'cashier.nav.scan' },
    { path: '/cashier/services', labelKey: 'cashier.nav.services' },
    { path: '/cashier/subscribers', labelKey: 'cashier.nav.subscribers' },
    { path: '/cashier/free-washes', labelKey: 'cashier.nav.freeWashes' }
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private washServices: WashServicesService
  ) {}

  ngOnInit(): void {
    this.cashier = this.auth.getUser();
    if (!this.cashier || this.cashier.role !== 'cashier' || !this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.washServices.load().subscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CashierComponent } from './pages/cashier/cashier.component';
import { CashierScanComponent } from './pages/cashier/cashier-scan/cashier-scan.component';
import { CashierServicesComponent } from './pages/cashier/cashier-services/cashier-services.component';
import { CashierSubscribersComponent } from './pages/cashier/cashier-subscribers/cashier-subscribers.component';
import { CashierFreeWashesComponent } from './pages/cashier/cashier-free-washes/cashier-free-washes.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'cashier',
    component: CashierComponent,
    children: [
      { path: '', redirectTo: 'scan', pathMatch: 'full' },
      { path: 'scan', component: CashierScanComponent },
      { path: 'services', component: CashierServicesComponent },
      { path: 'subscribers', component: CashierSubscribersComponent },
      { path: 'free-washes', component: CashierFreeWashesComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

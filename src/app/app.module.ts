import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CashierComponent } from './pages/cashier/cashier.component';
import { CashierScanComponent } from './pages/cashier/cashier-scan/cashier-scan.component';
import { CashierServicesComponent } from './pages/cashier/cashier-services/cashier-services.component';
import { CashierSubscribersComponent } from './pages/cashier/cashier-subscribers/cashier-subscribers.component';
import { CashierFreeWashesComponent } from './pages/cashier/cashier-free-washes/cashier-free-washes.component';
import { LanguageToggleComponent } from './components/language-toggle/language-toggle.component';
import { TranslatePipe } from './pipes/translate.pipe';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    CashierComponent,
    CashierScanComponent,
    CashierServicesComponent,
    CashierSubscribersComponent,
    CashierFreeWashesComponent,
    LanguageToggleComponent,
    TranslatePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

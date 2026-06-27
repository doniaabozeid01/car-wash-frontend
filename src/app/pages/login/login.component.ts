import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  fromSplash = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      phone: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fromSplash = history.state?.fromSplash === true;
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      return;
    }

    const { phone, password } = this.loginForm.value;
    const account = this.auth.login(phone, password);

    if (!account) {
      this.loginError = 'Invalid phone number or password.';
      return;
    }

    this.loginError = '';
    this.router.navigate([this.auth.getRouteForRole(account.role)]);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}

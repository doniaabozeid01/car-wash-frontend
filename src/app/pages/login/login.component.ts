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
  isSubmitting = false;

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
    if (this.auth.isLoggedIn()) {
      const user = this.auth.getUser();
      if (user) {
        void this.router.navigate([this.auth.getRouteForRole(user.role)]);
        return;
      }
    }

    this.fromSplash = history.state?.fromSplash === true;
  }

  onSubmit(): void {
    if (!this.loginForm.valid || this.isSubmitting) {
      return;
    }

    const { phone, password } = this.loginForm.value;
    this.isSubmitting = true;
    this.loginError = '';

    this.auth.login(phone, password).subscribe({
      next: (profile) => {
        this.isSubmitting = false;
        this.router.navigate([this.auth.getRouteForRole(profile.role)]);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 0) {
          this.loginError = 'login.networkError';
        } else if (err.status === 401 || err.status === 400) {
          this.loginError = 'login.error';
        } else {
          this.loginError = 'login.serverError';
        }
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}

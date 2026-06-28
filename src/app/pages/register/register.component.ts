import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  registerError = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      agreeTerms: [false, Validators.requiredTrue]
    });
  }

  onSubmit(): void {
    if (!this.registerForm.valid || this.isSubmitting) {
      return;
    }

    const { fullName, phone, password } = this.registerForm.value;
    this.isSubmitting = true;
    this.registerError = '';

    this.auth.register(fullName, phone, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/login'], {
          state: { registered: true }
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = err?.error?.title || err?.error?.message || err?.error;
        this.registerError = typeof message === 'string' ? message : 'register.error';
      }
    });
  }
}

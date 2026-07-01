import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();
    const isAuthRequest =
      req.url.includes('/api/Auth/login') || req.url.includes('/api/Auth/register');

    const authReq =
      !token || isAuthRequest
        ? req
        : req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isAuthRequest) {
          this.auth.logout();
          if (!this.router.url.startsWith('/login')) {
            void this.router.navigate(['/login']);
          }
        }

        return throwError(() => error);
      })
    );
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserProfile,
  UserRole
} from '../models/auth.models';
import { RewardsService } from './rewards.service';

const TOKEN_KEY = 'aura_auth_token';
const PROFILE_KEY = 'aura_auth_profile';
const EXPIRES_KEY = 'aura_auth_expires';

const JSON_HEADERS = new HttpHeaders({
  'Content-Type': 'application/json',
  Accept: 'application/json'
});

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: UserProfile | null = null;
  private token: string | null = null;

  constructor(
    private http: HttpClient,
    private rewards: RewardsService
  ) {
    this.restoreSession();
  }

  login(phone: string, password: string): Observable<UserProfile> {
    const body: LoginRequest = {
      phoneNumber: this.normalizePhone(phone),
      password: password.trim()
    };

    return this.http
      .post<LoginResponse>(this.apiUrl('/api/Auth/login'), body, { headers: JSON_HEADERS })
      .pipe(
        tap((response) => {
          const login = this.unwrapLoginResponse(response);
          const profile = this.mapProfile(login.profile);
          this.token = login.token;
          localStorage.setItem(TOKEN_KEY, login.token);
          localStorage.setItem(EXPIRES_KEY, login.expiresAt);
          this.persistProfile(profile);
        }),
        map((response) => this.mapProfile(this.unwrapLoginResponse(response).profile))
      );
  }

  register(fullName: string, phone: string, password: string, role = 'User'): Observable<void> {
    const body: RegisterRequest = {
      fullName: fullName.trim(),
      phoneNumber: this.normalizePhone(phone),
      password: password.trim(),
      role
    };

    return this.http.post<void>(this.apiUrl('/api/Auth/register'), body, { headers: JSON_HEADERS });
  }

  logout(): void {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }

  updateStoredPoints(points: number): void {
    if (!this.currentUser) {
      return;
    }

    this.currentUser = { ...this.currentUser, points };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(this.currentUser));
  }

  getUser(): UserProfile | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser && !!this.token && !this.isSessionExpired();
  }

  getRouteForRole(role: UserRole): string {
    return role === 'cashier' ? '/cashier' : '/dashboard';
  }

  getQrCodeDataUrl(profile?: UserProfile | null): string {
    const user = profile ?? this.currentUser;
    if (!user?.qrCodeBase64) {
      return '';
    }
    const value = user.qrCodeBase64.trim();
    if (value.startsWith('data:image')) {
      return value;
    }
    return `data:image/png;base64,${value}`;
  }

  fetchProfile(): Observable<UserProfile> {
    return this.http
      .get<LoginResponse['profile'] | Record<string, unknown>>(this.apiUrl('/api/Auth/profile'))
      .pipe(
        map((response) => this.mapProfile(response)),
        tap((profile) => this.persistProfile(profile))
      );
  }

  private persistProfile(profile: UserProfile): void {
    this.currentUser = profile;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    this.rewards.syncPoints(profile.points, profile.id);
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }

  private normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');

    if (digits.startsWith('20') && digits.length === 12) {
      digits = `0${digits.slice(2)}`;
    }

    return digits;
  }

  private unwrapLoginResponse(response: LoginResponse | Record<string, unknown>): LoginResponse {
    const raw = response as Record<string, unknown>;
    return {
      token: String(raw['token'] ?? raw['Token'] ?? ''),
      expiresAt: String(raw['expiresAt'] ?? raw['ExpiresAt'] ?? ''),
      profile: (raw['profile'] ?? raw['Profile']) as LoginResponse['profile']
    };
  }

  private restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const profileRaw = localStorage.getItem(PROFILE_KEY);

    if (!token || !profileRaw || this.isSessionExpired()) {
      this.logout();
      return;
    }

    try {
      this.token = token;
      this.currentUser = JSON.parse(profileRaw) as UserProfile;
      this.rewards.syncPoints(this.currentUser.points, this.currentUser.id);
    } catch {
      this.logout();
    }
  }

  private isSessionExpired(): boolean {
    const expiresAt = localStorage.getItem(EXPIRES_KEY);
    if (!expiresAt) {
      return false;
    }
    return new Date(expiresAt).getTime() <= Date.now();
  }

  private mapProfile(profile: LoginResponse['profile'] | Record<string, unknown>): UserProfile {
    const raw = profile as Record<string, unknown>;
    return {
      id: String(raw['id'] ?? raw['Id'] ?? ''),
      fullName: String(raw['fullName'] ?? raw['FullName'] ?? ''),
      phoneNumber: String(raw['phoneNumber'] ?? raw['PhoneNumber'] ?? ''),
      role: this.normalizeRole(String(raw['role'] ?? raw['Role'] ?? 'User')),
      points: Number(raw['points'] ?? raw['Points'] ?? 0),
      qrCodeBase64: String(raw['qrCodeBase64'] ?? raw['QrCodeBase64'] ?? '')
    };
  }

  private normalizeRole(role: string): UserRole {
    return role.toLowerCase() === 'cashier' ? 'cashier' : 'user';
  }
}

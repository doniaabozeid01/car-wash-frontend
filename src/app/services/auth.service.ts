import { Injectable } from '@angular/core';

export type UserRole = 'user' | 'cashier';

export interface AuthAccount {
  phone: string;
  password: string;
  role: UserRole;
  name: string;
  displayPhone: string;
}

const ACCOUNTS: AuthAccount[] = [
  {
    phone: '01119763303',
    password: 'Dd@00000',
    role: 'user',
    name: 'Alexander',
    displayPhone: '+20 111 976 3303'
  },
  {
    phone: '01221427766',
    password: 'Aa@00000',
    role: 'cashier',
    name: 'Cashier',
    displayPhone: '+20 122 142 7766'
  }
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: AuthAccount | null = null;

  login(phone: string, password: string): AuthAccount | null {
    const normalizedPhone = phone.replace(/\D/g, '');
    const account = ACCOUNTS.find(
      (entry) => entry.phone === normalizedPhone && entry.password === password
    );

    this.currentUser = account ?? null;
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
  }

  getUser(): AuthAccount | null {
    return this.currentUser;
  }

  getRouteForRole(role: UserRole): string {
    return role === 'cashier' ? '/cashier' : '/dashboard';
  }
}

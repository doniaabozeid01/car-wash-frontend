export type UserRole = 'user' | 'cashier';

export interface UserCar {
  id: number;
  carType: string;
  plateNumber: string;
  size: number;
  points: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  points: number;
  qrCodeBase64: string;
  cars: UserCar[];
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  profile: {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    points: number;
    qrCodeBase64: string;
    cars?: UserCar[];
  };
}

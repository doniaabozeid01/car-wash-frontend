export interface ScannedCar {
  id: number;
  carType: string;
  plateNumber: string;
  size: number;
  points: number;
}

export interface ScannedCustomer {
  id: string;
  fullName: string;
  phoneNumber: string;
  cars: ScannedCar[];
}

export interface ApplyPointsRequest {
  qrCode: string;
  serviceId: number;
  carId: number;
  amountPaid?: number;
  paymentMethod?: number;
}

export interface ApplyPointsResult {
  id: string;
  fullName: string;
  phoneNumber: string;
  cars: ScannedCar[];
}

export interface PointsUpdatedEvent {
  points: number;
  change: number;
  action: string;
}

export const API_PAYMENT_METHOD = {
  cash: 0,
  network: 1
} as const;

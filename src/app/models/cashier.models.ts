export type CarSize = 'small' | 'large';
export type PaymentMethod = 'cash' | 'network';

export interface WashServiceItem {
  id: number;
  nameEn: string;
  nameAr: string;
  points: number;
  price: number;
}

export interface CustomerCar {
  id: string;
  plateNumber: string;
  carType: string;
  size: CarSize;
  subscribedAt: string;
}

export interface CustomerRecord {
  id: string;
  fullName: string;
  phoneNumber: string;
  points: number;
  createdAt: string;
  cars: CustomerCar[];
}

export interface SubscriberRow {
  customerId: string;
  fullName: string;
  phoneNumber: string;
  points: number;
  createdAt: string;
  isNew: boolean;
  car: CustomerCar | null;
}

export interface SubscriberUser {
  id: string;
  fullName: string;
  phoneNumber: string;
}

export interface UserCarRecord {
  id: number;
  carType: string;
  plateNumber: string;
  size: number;
  points: number;
}

export interface CreateCarInput {
  userId: string;
  carType: string;
  plateNumber: string;
  size: number;
}

export interface FreeWashRecord {
  id: string;
  customerId: string;
  fullName: string;
  phoneNumber: string;
  carId: string;
  plateNumber: string;
  carType: string;
  carSize: CarSize;
  redeemedAt: string;
}

export interface WashTransaction {
  id: string;
  customerId: string;
  fullName: string;
  phoneNumber: string;
  serviceId: string | number;
  serviceNameEn: string;
  serviceNameAr: string;
  points: number;
  price: number;
  isFreeWash: boolean;
  paymentMethod: PaymentMethod | null;
  carId: string | null;
  plateNumber: string | null;
  carType: string | null;
  carSize: CarSize | null;
  createdAt: string;
}

export interface MonthlyActivitySummary {
  totalPrice: number;
  cashCount: number;
  cardCount: number;
  totalCount: number;
}

export interface WashRecord {
  id: number;
  userId: string;
  userFullName: string;
  carId: number;
  plateNumber: string;
  carType: string;
  carSize: number;
  washServiceId: number;
  serviceNameAr: string;
  serviceNameEn: string;
  pointsChange: number;
  carPointsAfter: number;
  amountPaid: number;
  paymentMethod: number | null;
  createdAt: string;
}

export interface WashRecordsReport {
  totalAmount: number;
  cashCount: number;
  networkCount: number;
  records: WashRecord[];
}

export interface UpsertServiceInput {
  nameEn: string;
  nameAr: string;
  points: number;
}

export interface AddCarInput {
  plateNumber: string;
  carType: string;
  size: CarSize;
}

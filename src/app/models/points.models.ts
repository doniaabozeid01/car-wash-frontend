export enum PointsActionType {
  Add30 = 0,
  Add50 = 1,
  Subtract250 = 2
}

export interface ScannedCustomer {
  id: string;
  fullName: string;
  phoneNumber: string;
  points: number;
}

export interface ApplyPointsRequest {
  qrCode: string;
  action: PointsActionType;
}

export interface ApplyPointsResult {
  points: number;
  fullName: string;
}

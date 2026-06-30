export enum CarSize {
  Small = 0,
  Medium = 1,
  Large = 2
}

export type CarSizeLabelScope = 'dashboard' | 'cashier.subscribers';

export function getCarSizeLabelKey(size: number, scope: CarSizeLabelScope = 'dashboard'): string {
  switch (size) {
    case CarSize.Medium:
      return `${scope}.sizeMedium`;
    case CarSize.Large:
      return `${scope}.sizeLarge`;
    default:
      return `${scope}.sizeSmall`;
  }
}

export function getCarSizeModifier(size: number): 'small' | 'medium' | 'large' {
  switch (size) {
    case CarSize.Medium:
      return 'medium';
    case CarSize.Large:
      return 'large';
    default:
      return 'small';
  }
}

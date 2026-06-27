import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const STORAGE_KEY = 'aura_member_points';
const DEFAULT_MEMBER_ID = '772-910';
const FREE_WASH_COST = 250;

@Injectable({ providedIn: 'root' })
export class RewardsService {
  readonly pointsChanged$ = new Subject<string>();

  getPoints(memberId = DEFAULT_MEMBER_ID): number {
    const stored = localStorage.getItem(this.storageKey(memberId));
    if (stored !== null) {
      return Number(stored);
    }
    return memberId === DEFAULT_MEMBER_ID ? 180 : 0;
  }

  addPoints(amount: number, memberId = DEFAULT_MEMBER_ID): number {
    const next = this.getPoints(memberId) + amount;
    this.setPoints(next, memberId);
    return next;
  }

  redeemFreeWash(memberId = DEFAULT_MEMBER_ID): { success: boolean; points: number } {
    const current = this.getPoints(memberId);
    if (current < FREE_WASH_COST) {
      return { success: false, points: current };
    }
    const next = current - FREE_WASH_COST;
    this.setPoints(next, memberId);
    return { success: true, points: next };
  }

  getFreeWashGoal(): number {
    return FREE_WASH_COST;
  }

  private setPoints(points: number, memberId: string): void {
    localStorage.setItem(this.storageKey(memberId), String(Math.max(0, points)));
    this.pointsChanged$.next(memberId);
  }

  private storageKey(memberId: string): string {
    return `${STORAGE_KEY}_${memberId}`;
  }
}

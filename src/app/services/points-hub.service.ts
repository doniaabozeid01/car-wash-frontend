import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { PointsUpdatedEvent } from '../models/points.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PointsHubService implements OnDestroy {
  readonly pointsUpdated$ = new Subject<PointsUpdatedEvent>();

  private connection: HubConnection | null = null;
  private connecting = false;

  constructor(
    private auth: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnDestroy(): void {
    void this.disconnect();
  }

  async connect(): Promise<void> {
    const token = this.auth.getToken();
    if (!token || this.connecting) {
      return;
    }

    if (this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    this.connecting = true;

    try {
      await this.disconnect();

      const hubUrl = `${environment.apiUrl.replace(/\/$/, '')}/hubs/points`;
      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => this.auth.getToken() ?? ''
        })
        .withAutomaticReconnect()
        .build();

      this.connection.on('PointsUpdated', (data: Record<string, unknown>) => {
        this.ngZone.run(() => {
          this.pointsUpdated$.next(this.mapPointsUpdated(data));
        });
      });

      await this.connection.start();
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.stop();
    } catch {
      // Connection may already be stopped.
    }

    this.connection = null;
  }

  private mapPointsUpdated(raw: Record<string, unknown>): PointsUpdatedEvent {
    return {
      points: Number(raw['points'] ?? raw['Points'] ?? 0),
      change: Number(raw['change'] ?? raw['Change'] ?? 0),
      action: String(raw['action'] ?? raw['Action'] ?? '')
    };
  }
}

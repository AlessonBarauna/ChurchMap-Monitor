import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiffDetectedEvent {
  location: string;
  newCount: number;
  closedCount: number;
}

export interface ScanEvent {
  location: string;
  totalCount?: number;
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hub!: HubConnection;

  diffDetected$  = new Subject<DiffDetectedEvent>();
  scanStarted$   = new Subject<ScanEvent>();
  scanCompleted$ = new Subject<ScanEvent>();

  async connect(): Promise<void> {
    this.hub = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/monitor`, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    this.hub.on('DiffDetected',  (data: DiffDetectedEvent) => this.diffDetected$.next(data));
    this.hub.on('ScanStarted',   (data: ScanEvent)         => this.scanStarted$.next(data));
    this.hub.on('ScanCompleted', (data: ScanEvent)         => this.scanCompleted$.next(data));

    try {
      await this.hub.start();
      console.log('SignalR conectado.');
    } catch (err) {
      console.warn('SignalR: falha na conexão inicial.', err);
    }
  }
}

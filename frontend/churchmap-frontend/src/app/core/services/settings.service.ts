import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MonitorSettings } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  get(): Observable<MonitorSettings> {
    return this.http.get<MonitorSettings>(`${this.base}/api/settings`);
  }

  update(settings: MonitorSettings): Observable<void> {
    return this.http.put<void>(`${this.base}/api/settings`, settings);
  }

  scanNow(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/api/settings/scan-now`, {});
  }
}

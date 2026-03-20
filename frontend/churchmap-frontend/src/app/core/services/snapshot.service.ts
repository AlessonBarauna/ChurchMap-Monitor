import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Snapshot } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SnapshotService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAll(locationKey: string): Observable<Snapshot[]> {
    return this.http.get<Snapshot[]>(`${this.base}/api/snapshots`, {
      params: { location: locationKey }
    });
  }

  getLatest(locationKey: string): Observable<Snapshot> {
    return this.http.get<Snapshot>(`${this.base}/api/snapshots/latest`, {
      params: { location: locationKey }
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/snapshots/${id}`);
  }
}

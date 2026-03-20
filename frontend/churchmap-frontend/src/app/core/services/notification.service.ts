import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationRecord } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  notifications = signal<NotificationRecord[]>([]);
  unreadCount   = signal(0);

  reload(type?: string, read?: boolean): void {
    const params: Record<string, string> = {};
    if (type !== undefined) params['type'] = type;
    if (read !== undefined) params['read'] = String(read);

    this.http.get<NotificationRecord[]>(`${this.base}/api/notifications`, { params }).subscribe(list => {
      this.notifications.set(list);
      this.unreadCount.set(list.filter(n => !n.isRead).length);
    });
  }

  markAllRead(): void {
    this.http.put<void>(`${this.base}/api/notifications/read-all`, {}).subscribe(() => this.reload());
  }

  delete(id: number): void {
    this.http.delete<void>(`${this.base}/api/notifications/${id}`).subscribe(() => this.reload());
  }
}

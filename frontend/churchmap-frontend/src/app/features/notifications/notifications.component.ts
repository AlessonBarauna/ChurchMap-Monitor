import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule],
  template: `
    <div class="notif-page">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <span class="page-icon">🔔</span>
          <div>
            <h2>Notificações</h2>
            <p>Alterações detectadas nas varreduras</p>
          </div>
        </div>
        @if (svc.notifications().length > 0) {
          <button class="read-all-btn" (click)="svc.markAllRead()">
            <mat-icon>done_all</mat-icon>
            Marcar todas como lidas
          </button>
        }
      </div>

      <!-- Empty -->
      @if (svc.notifications().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🔕</div>
          <h3>Tudo em dia</h3>
          <p>Nenhuma notificação por enquanto.<br>As alterações detectadas aparecerão aqui.</p>
        </div>
      }

      <!-- List -->
      <div class="notif-list">
        @for (n of svc.notifications(); track n.id) {
          <div class="notif-card" [class.unread]="!n.isRead"
               [class.type-new]="n.type === 'new'"
               [class.type-closed]="n.type === 'closed'">

            <div class="notif-accent-bar"></div>

            <div class="notif-icon-wrap" [class.new]="n.type === 'new'" [class.closed]="n.type === 'closed'">
              <mat-icon>{{ n.type === 'new' ? 'add_location_alt' : 'wrong_location' }}</mat-icon>
            </div>

            <div class="notif-content">
              <div class="notif-top">
                <span class="type-chip" [class.new]="n.type === 'new'" [class.closed]="n.type === 'closed'">
                  {{ n.type === 'new' ? '✦ Nova' : '✕ Fechada' }}
                </span>
                @if (!n.isRead) {
                  <span class="unread-dot"></span>
                }
              </div>
              <div class="notif-name">{{ n.churchName }}</div>
              <div class="notif-meta">
                <span class="meta-tag">
                  <mat-icon>place</mat-icon>
                  {{ n.locationLabel }}
                </span>
                @if (n.address) {
                  <span class="meta-tag">
                    <mat-icon>map</mat-icon>
                    {{ n.address }}
                  </span>
                }
                <span class="meta-tag">
                  <mat-icon>schedule</mat-icon>
                  {{ n.createdAt | date:'dd/MM/yy HH:mm' }}
                </span>
              </div>
            </div>

            <button class="delete-btn" (click)="svc.delete(n.id)" title="Remover">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .notif-page {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      animation: fade-in 0.3s ease;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .page-icon { font-size: 1.75rem; }

    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.02em;
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      color: var(--muted);
    }

    .read-all-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 8px;
      color: var(--text2);
      font-family: 'Syne', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &:hover { border-color: var(--accent); color: var(--accent); background: var(--glow2); }
    }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 5rem 2rem;
      animation: fade-in 0.5s ease;
    }

    .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.4; }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: var(--text2);
    }

    .empty-state p {
      color: var(--muted);
      line-height: 1.6;
    }

    /* Notification Cards */
    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .notif-card {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem 1rem 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      transition: border-color 0.2s, background 0.2s, transform 0.15s;
      animation: slide-in 0.3s ease;

      &:hover { border-color: var(--border2); background: var(--surface2); transform: translateX(2px); }

      &.unread { background: rgba(124,111,255,0.04); }
      &.unread.type-new { border-color: rgba(0,229,176,0.2); }
      &.unread.type-closed { border-color: rgba(255,95,126,0.2); }
    }

    .notif-accent-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      border-radius: 0 2px 2px 0;

      .type-new & { background: linear-gradient(180deg, var(--success), transparent); }
      .type-closed & { background: linear-gradient(180deg, var(--danger), transparent); }
    }

    .notif-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      flex-shrink: 0;
      margin-top: 2px;

      mat-icon { font-size: 1.25rem; }

      &.new    { background: var(--success-bg); color: var(--success); }
      &.closed { background: var(--danger-bg);  color: var(--danger); }
    }

    .notif-content { flex: 1; min-width: 0; }

    .notif-top {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
    }

    .type-chip {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;

      &.new    { background: var(--success-bg); color: var(--success); }
      &.closed { background: var(--danger-bg);  color: var(--danger); }
    }

    .unread-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--glow);
      flex-shrink: 0;
    }

    .notif-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.4rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.72rem;
      color: var(--muted);
      font-family: 'Syne', sans-serif;
      mat-icon { font-size: 0.8rem; width: 0.8rem; height: 0.8rem; }
    }

    .delete-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: none;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      color: var(--muted);
      flex-shrink: 0;
      margin-top: 4px;
      transition: all 0.15s;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &:hover { background: var(--danger-bg); color: var(--danger); }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  protected svc = inject(NotificationService);

  ngOnInit(): void { this.svc.reload(); }
}

import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatBadgeModule],
  template: `
    <header class="header">
      <!-- Brand -->
      <div class="brand">
        <div class="brand-icon">
          <span class="brand-emoji">⛪</span>
          <div class="brand-glow"></div>
        </div>
        <div class="brand-text">
          <span class="brand-name">ChurchMap</span>
          <span class="brand-sub">Monitor</span>
        </div>
      </div>

      <!-- Search -->
      <div class="search-wrapper">
        <div class="search-box" [class.focused]="focused">
          <mat-icon class="search-icon">travel_explore</mat-icon>
          <input
            class="search-input"
            [(ngModel)]="query"
            (keyup.enter)="doSearch()"
            (focus)="focused = true"
            (blur)="focused = false"
            placeholder="Buscar cidade ou região... Ex: São Paulo"
          />
          @if (query) {
            <button class="clear-btn" (click)="query = ''" type="button">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
        <button class="search-btn" (click)="doSearch()" [disabled]="!query.trim()">
          <mat-icon>search</mat-icon>
          <span>Buscar</span>
        </button>
      </div>

      <!-- Actions -->
      <div class="header-actions">
        <button class="action-btn" title="Notificações"
                (click)="notifClick.emit()"
                [class.has-badge]="notifCount() > 0">
          <mat-icon>notifications</mat-icon>
          @if (notifCount() > 0) {
            <span class="badge">{{ notifCount() > 99 ? '99+' : notifCount() }}</span>
          }
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.875rem 1.75rem;
      background: rgba(7, 7, 16, 0.95);
      backdrop-filter: blur(24px);
      border-bottom: 1px solid var(--border);
      z-index: 100;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--accent), transparent);
        opacity: 0.4;
      }
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .brand-icon {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(124,111,255,0.2), rgba(124,111,255,0.05));
      border: 1px solid rgba(124,111,255,0.3);
      border-radius: 10px;
    }

    .brand-emoji { font-size: 1.2rem; }

    .brand-glow {
      position: absolute;
      inset: -4px;
      border-radius: 12px;
      background: var(--glow);
      filter: blur(8px);
      opacity: 0;
      transition: opacity 0.3s;
    }

    .brand:hover .brand-glow { opacity: 0.5; }

    .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand-name {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    /* Search */
    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex: 1;
      max-width: 560px;
    }

    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1rem;
      height: 42px;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 10px;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

      &.focused {
        border-color: var(--accent);
        background: rgba(124,111,255,0.06);
        box-shadow: 0 0 0 3px var(--glow2), inset 0 1px 2px rgba(0,0,0,0.3);
      }
    }

    .search-icon {
      color: var(--muted);
      font-size: 1.1rem;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--text);
      font-family: 'Syne', sans-serif;
      font-size: 0.9rem;
      &::placeholder { color: var(--muted); }
    }

    .clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted);
      padding: 2px;
      border-radius: 4px;
      transition: color 0.2s;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &:hover { color: var(--text); }
    }

    .search-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0 1.25rem;
      height: 42px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border: none;
      border-radius: 10px;
      color: white;
      font-family: 'Syne', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
      flex-shrink: 0;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 12px rgba(124,111,255,0.35);

      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
      &:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 4px 20px rgba(124,111,255,0.5); }
      &:active:not(:disabled) { transform: scale(0.97); }
      &:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
    }

    /* Actions */
    .header-actions { margin-left: auto; }

    .action-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 10px;
      cursor: pointer;
      color: var(--text2);
      transition: border-color 0.2s, color 0.2s, background 0.2s;

      mat-icon { font-size: 1.25rem; }
      &:hover { border-color: var(--accent); color: var(--accent); background: var(--glow2); }
      &.has-badge { border-color: rgba(124,111,255,0.4); }
    }

    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: var(--accent);
      border-radius: 99px;
      font-size: 0.65rem;
      font-weight: 700;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg);
      animation: fade-in 0.3s ease;
    }
  `]
})
export class HeaderComponent {
  @Output() search     = new EventEmitter<string>();
  @Output() notifClick = new EventEmitter<void>();

  protected query     = '';
  protected focused   = false;
  protected notifCount = inject(NotificationService).unreadCount;

  protected doSearch(): void {
    if (this.query.trim()) this.search.emit(this.query.trim());
  }
}

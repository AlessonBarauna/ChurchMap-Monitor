import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AppStats } from '../../core/models';

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (stats()) {
      <div class="stats-bar" @slideIn>
        <div class="stat-card">
          <div class="stat-icon total">
            <span>⛪</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()!.total | number }}</span>
            <span class="stat-label">Igrejas</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="stat-card success">
          <div class="stat-icon new">
            <span>↑</span>
          </div>
          <div class="stat-info">
            <span class="stat-value success">+{{ stats()!.newCount }}</span>
            <span class="stat-label">Novas</span>
          </div>
        </div>

        <div class="stat-card danger">
          <div class="stat-icon closed">
            <span>↓</span>
          </div>
          <div class="stat-info">
            <span class="stat-value danger">{{ stats()!.closedCount }}</span>
            <span class="stat-label">Fechadas</span>
          </div>
        </div>

        @if (stats()!.lastScan) {
          <div class="divider"></div>
          <div class="stat-card">
            <div class="stat-icon clock">
              <span>⏱</span>
            </div>
            <div class="stat-info">
              <span class="stat-value mono small">{{ stats()!.lastScan }}</span>
              <span class="stat-label">Última varredura</span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .stats-bar {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1.75rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--border);
      animation: slide-in 0.4s ease;
      overflow-x: auto;
      &::-webkit-scrollbar { display: none; }
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.375rem 0.875rem;
      border-radius: 8px;
      transition: background 0.2s;
      cursor: default;
      &:hover { background: var(--surface2); }
    }

    .stat-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 0.9rem;

      &.total  { background: rgba(124,111,255,0.12); }
      &.new    { background: var(--success-bg); }
      &.closed { background: var(--danger-bg); }
      &.clock  { background: rgba(255,255,255,0.04); }
    }

    .stat-info { display: flex; flex-direction: column; line-height: 1.15; }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.02em;
      font-family: 'DM Mono', monospace;

      &.success { color: var(--success); }
      &.danger  { color: var(--danger); }
      &.small   { font-size: 0.875rem; }
    }

    .stat-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .divider {
      width: 1px;
      height: 28px;
      background: var(--border);
      margin: 0 0.5rem;
      flex-shrink: 0;
    }
  `]
})
export class StatsBarComponent {
  stats = input<AppStats | null>(null);
}

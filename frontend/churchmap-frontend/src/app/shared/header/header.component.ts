import { Component, EventEmitter, inject, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../core/services/notification.service';
import { Church } from '../../core/models';

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
        <div class="search-box" [class.focused]="focused" [class.has-results]="suggestions.length > 0">
          <mat-icon class="search-icon">{{ suggestions.length > 0 ? 'church' : 'travel_explore' }}</mat-icon>
          <input
            class="search-input"
            [(ngModel)]="query"
            (ngModelChange)="onQueryChange($event)"
            (keyup.enter)="onEnter()"
            (keyup.escape)="closeSuggestions()"
            (keyup.arrowdown)="moveFocus(1)"
            (keyup.arrowup)="moveFocus(-1)"
            (focus)="onFocus()"
            (blur)="onBlur()"
            [placeholder]="churches().length > 0 ? 'Buscar cidade ou nome de igreja...' : 'Buscar cidade ou região... Ex: São Paulo'"
          />
          @if (query) {
            <button class="clear-btn" (click)="clearQuery()" type="button">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <!-- Autocomplete dropdown -->
        @if (suggestions.length > 0 && focused) {
          <div class="suggestions">
            <div class="suggestions-header">
              <mat-icon>church</mat-icon>
              <span>Igrejas encontradas</span>
            </div>
            @for (s of suggestions; track s.id; let i = $index) {
              <button class="suggestion-item" [class.highlighted]="i === focusedIndex"
                      (mousedown)="selectSuggestion(s)">
                <div class="suggestion-name">{{ s.name }}</div>
                @if (s.denomination || s.suburb) {
                  <div class="suggestion-meta">
                    {{ meta(s) }}
                  </div>
                }
              </button>
            }
            @if (totalMatches > suggestions.length) {
              <div class="suggestions-more">
                +{{ totalMatches - suggestions.length }} outras — refine a busca
              </div>
            }
          </div>
        }

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
      z-index: 1000;

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
    .brand-name { font-size: 1rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
    .brand-sub  { font-size: 0.65rem; font-weight: 600; color: var(--accent); letter-spacing: 0.12em; text-transform: uppercase; }

    /* Search */
    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex: 1;
      max-width: 560px;
      position: relative;
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

      &.has-results.focused {
        border-radius: 10px 10px 0 0;
        border-bottom-color: transparent;
      }
    }

    .search-icon {
      color: var(--muted);
      font-size: 1.1rem;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .search-box.has-results .search-icon { color: var(--accent); }

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

    /* Dropdown */
    .suggestions {
      position: absolute;
      top: 42px;
      left: 0;
      right: 76px; /* largura do botão + gap */
      background: rgba(10,10,22,0.98);
      backdrop-filter: blur(20px);
      border: 1px solid var(--accent);
      border-top: none;
      border-radius: 0 0 10px 10px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      z-index: 200;
      overflow: hidden;
      animation: fade-in 0.15s ease;
    }

    .suggestions-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--border);
      mat-icon { font-size: 0.75rem; width: 0.75rem; height: 0.75rem; }
    }

    .suggestion-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      padding: 0.5rem 0.875rem;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s;
      border-bottom: 1px solid var(--border);

      &:last-child { border-bottom: none; }
      &:hover, &.highlighted { background: rgba(124,111,255,0.1); }
    }

    .suggestion-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text);
    }

    .suggestion-meta {
      font-size: 0.72rem;
      color: var(--muted);
    }

    .suggestions-more {
      padding: 0.4rem 0.875rem;
      font-size: 0.72rem;
      color: var(--muted);
      font-style: italic;
      text-align: center;
      border-top: 1px solid var(--border);
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
      z-index: 1;

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
  @Output() search      = new EventEmitter<string>();
  @Output() notifClick  = new EventEmitter<void>();
  @Output() churchFocus = new EventEmitter<Church>();

  churches = input<Church[]>([]);

  protected query        = '';
  protected focused      = false;
  protected suggestions: Church[] = [];
  protected totalMatches = 0;
  protected focusedIndex = -1;

  private notifService = inject(NotificationService);
  protected notifCount = this.notifService.unreadCount;

  private readonly MAX_SUGGESTIONS = 8;

  protected onQueryChange(value: string): void {
    this.focusedIndex = -1;
    if (!value.trim() || this.churches().length === 0) {
      this.suggestions = [];
      this.totalMatches = 0;
      return;
    }
    const term = value.trim().toLowerCase();
    const all  = this.churches().filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.denomination ?? '').toLowerCase().includes(term) ||
      (c.suburb ?? '').toLowerCase().includes(term)
    );
    this.totalMatches = all.length;
    this.suggestions  = all.slice(0, this.MAX_SUGGESTIONS);
  }

  protected onEnter(): void {
    if (this.focusedIndex >= 0 && this.suggestions[this.focusedIndex]) {
      this.selectSuggestion(this.suggestions[this.focusedIndex]);
    } else if (this.suggestions.length === 1) {
      this.selectSuggestion(this.suggestions[0]);
    } else {
      this.doSearch();
    }
  }

  protected moveFocus(dir: 1 | -1): void {
    if (this.suggestions.length === 0) return;
    this.focusedIndex = Math.max(-1, Math.min(this.suggestions.length - 1, this.focusedIndex + dir));
  }

  protected selectSuggestion(c: Church): void {
    this.query = c.name;
    this.suggestions = [];
    this.totalMatches = 0;
    this.churchFocus.emit(c);
  }

  protected doSearch(): void {
    if (!this.query.trim()) return;
    this.suggestions = [];
    this.totalMatches = 0;
    this.search.emit(this.query.trim());
  }

  protected clearQuery(): void {
    this.query = '';
    this.suggestions = [];
    this.totalMatches = 0;
    this.focusedIndex = -1;
  }

  protected onFocus(): void {
    this.focused = true;
    // Reabre sugestões se já havia texto
    if (this.query.trim()) this.onQueryChange(this.query);
  }

  protected onBlur(): void {
    // Delay para permitir click na sugestão antes de fechar
    setTimeout(() => {
      this.focused = false;
      this.focusedIndex = -1;
    }, 180);
  }

  protected meta(c: Church): string {
    return [c.denomination, c.suburb].filter(v => !!v).join(' · ');
  }

  protected closeSuggestions(): void {
    this.suggestions = [];
    this.focusedIndex = -1;
  }
}

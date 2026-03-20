import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HeaderComponent } from './shared/header/header.component';
import { StatsBarComponent } from './shared/stats-bar/stats-bar.component';
import { StatusBarComponent } from './shared/status-bar/status-bar.component';
import { MapComponent } from './features/map/map.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { TableComponent } from './features/table/table.component';
import { HistoryComponent } from './features/history/history.component';
import { SettingsComponent } from './features/settings/settings.component';

import { ChurchService } from './core/services/church.service';
import { NotificationService } from './core/services/notification.service';
import { SignalRService } from './core/services/signalr.service';
import { AppStats, Church, DiffResult } from './core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatTabsModule, MatIconModule, MatSnackBarModule,
    HeaderComponent, StatsBarComponent, StatusBarComponent,
    MapComponent, NotificationsComponent, TableComponent,
    HistoryComponent, SettingsComponent
  ],
  template: `
    <div class="app-shell">
      <app-header (search)="onSearch($event)"
                  (notifClick)="selectedTabIndex = 1"
                  (churchFocus)="onChurchSelect($event)"
                  [churches]="churches()" />

      @if (stats()) {
        <app-stats-bar [stats]="stats()" />
      }

      <app-status-bar [status]="status()" [isActive]="isActive()" />

      <!-- Filtro por denominação -->
      @if (denominations().length > 0) {
        <div class="denom-bar">
          <button class="denom-chip" [class.active]="selectedDenoms().size === 0"
                  (click)="clearDenomFilter()">
            Todas
          </button>
          @for (d of denominations(); track d) {
            <button class="denom-chip" [class.active]="selectedDenoms().has(d)"
                    (click)="toggleDenom(d)">
              {{ d }}
            </button>
          }
        </div>
      }

      <mat-tab-group [(selectedIndex)]="selectedTabIndex"
                     animationDuration="180ms"
                     color="accent"
                     class="main-tabs">

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">map</mat-icon>
            <span>Mapa</span>
          </ng-template>
          <app-map [churches]="filteredChurches()"
                   [diff]="diff()"
                   [highlightChurch]="highlightedChurch()" />
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">notifications</mat-icon>
            <span>Notificações</span>
            @if (unreadCount() > 0) {
              <span class="tab-badge">{{ unreadCount() }}</span>
            }
          </ng-template>
          <app-notifications />
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">table_rows</mat-icon>
            <span>Tabela</span>
          </ng-template>
          <app-table [churches]="filteredChurches()"
                     (churchSelect)="onChurchSelect($event)" />
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">timeline</mat-icon>
            <span>Histórico</span>
          </ng-template>
          <app-history [locationKey]="currentLocation()" />
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">settings</mat-icon>
            <span>Config</span>
          </ng-template>
          <app-settings />
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    /* Barra de denominações */
    .denom-bar {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1.25rem;
      overflow-x: auto;
      scrollbar-width: none;
      border-bottom: 1px solid var(--border);
      background: rgba(7,7,16,0.6);
      backdrop-filter: blur(8px);
      flex-shrink: 0;

      &::-webkit-scrollbar { display: none; }
    }

    .denom-chip {
      flex-shrink: 0;
      padding: 3px 10px;
      border-radius: 99px;
      border: 1px solid var(--border2);
      background: transparent;
      color: var(--muted);
      font-family: 'Syne', sans-serif;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;

      &:hover { border-color: var(--accent); color: var(--text2); }

      &.active {
        background: rgba(124,111,255,0.15);
        border-color: rgba(124,111,255,0.4);
        color: var(--accent);
      }
    }

    .main-tabs {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    ::ng-deep .main-tabs .mat-mdc-tab-body-wrapper {
      flex: 1;
      min-height: 0;
    }

    ::ng-deep .main-tabs .mat-mdc-tab-body-content {
      overflow: auto !important;
      height: 100%;
    }

    .tab-icon {
      font-size: 1.1rem !important;
      width: 1.1rem !important;
      height: 1.1rem !important;
      margin-right: 0.375rem;
      vertical-align: middle;
    }

    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: var(--accent);
      border-radius: 99px;
      font-size: 0.65rem;
      font-weight: 700;
      color: white;
      margin-left: 0.375rem;
      vertical-align: middle;
    }
  `]
})
export class AppComponent implements OnInit {
  private churchService = inject(ChurchService);
  private notifService  = inject(NotificationService);
  private signalR       = inject(SignalRService);
  private snackBar      = inject(MatSnackBar);

  selectedTabIndex = 0;

  churches         = signal<Church[]>([]);
  diff             = signal<DiffResult | null>(null);
  currentLocation  = signal('');
  status           = signal('Pronto');
  isActive         = signal(false);
  stats            = signal<AppStats | null>(null);
  highlightedChurch = signal<Church | null>(null);
  selectedDenoms   = signal<Set<string>>(new Set());
  unreadCount      = this.notifService.unreadCount;

  // Lista única de denominações ordenada, excluindo vazias
  denominations = computed(() =>
    [...new Set(
      this.churches()
        .map(c => c.denomination ?? '')
        .filter(d => d.trim() !== '')
    )].sort()
  );

  // Igrejas filtradas pela denominação selecionada
  filteredChurches = computed(() => {
    const sel = this.selectedDenoms();
    if (sel.size === 0) return this.churches();
    return this.churches().filter(c => sel.has(c.denomination ?? ''));
  });

  async ngOnInit(): Promise<void> {
    this.notifService.reload();
    await this.signalR.connect();

    this.signalR.diffDetected$.subscribe(d => {
      this.notifService.reload();
      const action = this.snackBar.open(
        `🔔 Diff em ${d.location}: +${d.newCount} novas, -${d.closedCount} fechadas`,
        'Ver',
        { duration: 7000 }
      );
      action.onAction().subscribe(() => this.selectedTabIndex = 1);
    });

    this.signalR.scanStarted$.subscribe(e => {
      this.status.set(`Varrendo "${e.location}"...`);
      this.isActive.set(true);
    });

    this.signalR.scanCompleted$.subscribe(e => {
      this.status.set(`Varredura concluída — ${e.totalCount} igrejas em "${e.location}"`);
      this.isActive.set(false);
    });
  }

  onSearch(location: string): void {
    this.status.set(`Buscando "${location}"...`);
    this.isActive.set(true);
    this.selectedDenoms.set(new Set());
    this.highlightedChurch.set(null);

    this.churchService.search(location).subscribe({
      next: result => {
        this.churches.set(result.elements);
        this.diff.set(result.diff);
        this.currentLocation.set(result.snapshot.locationKey);
        this.stats.set({
          total:       result.snapshot.totalCount,
          newCount:    result.diff?.newChurches.length ?? 0,
          closedCount: result.diff?.closedChurches.length ?? 0,
          lastScan:    new Date().toLocaleTimeString('pt-BR')
        });
        this.status.set(`${result.elements.length} igrejas encontradas em "${location}"`);
        this.isActive.set(false);
        this.selectedTabIndex = 0;
      },
      error: () => {
        this.status.set('Erro ao buscar. Verifique se o backend está rodando.');
        this.isActive.set(false);
      }
    });
  }

  // Clique na linha da tabela → vai para o mapa e destaca o marcador
  onChurchSelect(c: Church): void {
    this.highlightedChurch.set(null);        // reset para forçar o effect a disparar
    setTimeout(() => {
      this.highlightedChurch.set(c);
      this.selectedTabIndex = 0;            // muda para aba Mapa
    }, 0);
  }

  toggleDenom(d: string): void {
    const sel = new Set(this.selectedDenoms());
    if (sel.has(d)) sel.delete(d); else sel.add(d);
    this.selectedDenoms.set(sel);
    this.highlightedChurch.set(null);
  }

  clearDenomFilter(): void {
    this.selectedDenoms.set(new Set());
    this.highlightedChurch.set(null);
  }
}

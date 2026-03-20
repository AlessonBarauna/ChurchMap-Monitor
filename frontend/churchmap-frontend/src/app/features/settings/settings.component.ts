import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule,
    MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule
  ],
  template: `
    <div class="settings-page">
      <!-- Header -->
      <div class="page-header">
        <span>⚙️</span>
        <div>
          <h2>Configurações</h2>
          <p>Controle o monitoramento automático</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="settings-form">

        <!-- Monitor toggle -->
        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon monitor">📡</div>
            <div>
              <div class="section-title">Monitoramento automático</div>
              <div class="section-desc">Varre automaticamente as localizações em intervalos definidos</div>
            </div>
            <mat-slide-toggle formControlName="isEnabled" color="accent" class="toggle"></mat-slide-toggle>
          </div>

          @if (form.get('isEnabled')?.value) {
            <div class="subsetting">
              <label class="sublabel">Intervalo de varredura</label>
              <div class="interval-chips">
                @for (opt of intervalOptions; track opt.value) {
                  <button type="button" class="interval-chip"
                          [class.active]="form.get('intervalMinutes')?.value === opt.value"
                          (click)="form.get('intervalMinutes')?.setValue(opt.value)">
                    {{ opt.label }}
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Locations -->
        <div class="settings-section">
          <div class="section-header-simple">
            <div class="section-icon locations">🌍</div>
            <div>
              <div class="section-title">Localizações monitoradas</div>
              <div class="section-desc">Cidades ou regiões para varrer automaticamente</div>
            </div>
          </div>

          <div class="add-location-row">
            <div class="loc-input-wrap">
              <mat-icon>search</mat-icon>
              <input class="loc-input" [(ngModel)]="newLocation" [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addLocation()"
                     placeholder="Ex: Curitiba, Fortaleza, Manaus..." />
            </div>
            <button type="button" class="add-btn" (click)="addLocation()" [disabled]="!newLocation.trim()">
              <mat-icon>add</mat-icon>
              Adicionar
            </button>
          </div>

          @if (locations().length === 0) {
            <div class="loc-empty">Nenhuma localização configurada</div>
          } @else {
            <div class="locations-grid">
              @for (loc of locations(); track loc) {
                <div class="loc-card">
                  <span class="loc-name">{{ loc }}</span>
                  <button type="button" class="loc-remove" (click)="removeLocation(loc)" title="Remover">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="settings-actions">
          <button class="save-btn" type="submit">
            <mat-icon>save</mat-icon>
            Salvar configurações
          </button>
          <button class="scan-btn" type="button" (click)="scanNow()" [disabled]="scanning()">
            <mat-icon>{{ scanning() ? 'hourglass_empty' : 'radar' }}</mat-icon>
            {{ scanning() ? 'Varrendo...' : 'Varredura manual' }}
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .settings-page {
      padding: 1.5rem;
      max-width: 700px;
      animation: fade-in 0.3s ease;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.75rem;
      font-size: 1.4rem;
    }

    h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text); }
    p  { margin: 0; font-size: 0.8rem; color: var(--muted); }

    /* Sections */
    .settings-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      margin-bottom: 1rem;
      transition: border-color 0.2s;
      &:hover { border-color: var(--border2); }
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .section-header-simple {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .section-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;

      &.monitor   { background: rgba(124,111,255,0.1); border: 1px solid rgba(124,111,255,0.2); }
      &.locations { background: rgba(0,229,176,0.08); border: 1px solid rgba(0,229,176,0.15); }
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
    }

    .section-desc {
      font-size: 0.78rem;
      color: var(--muted);
      margin-top: 2px;
    }

    .toggle { margin-left: auto; }

    /* Subsetting */
    .subsetting {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .sublabel {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 0.625rem;
    }

    .interval-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .interval-chip {
      padding: 0.375rem 0.875rem;
      border: 1px solid var(--border2);
      border-radius: 8px;
      background: var(--surface2);
      color: var(--text2);
      font-family: 'Syne', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { border-color: var(--accent); color: var(--accent); }
      &.active {
        background: rgba(124,111,255,0.15);
        border-color: var(--accent);
        color: var(--accent);
        box-shadow: 0 0 10px var(--glow2);
      }
    }

    /* Locations */
    .add-location-row {
      display: flex;
      gap: 0.625rem;
      margin-bottom: 0.875rem;
    }

    .loc-input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.875rem;
      height: 40px;
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: 8px;
      transition: border-color 0.2s, box-shadow 0.2s;
      &:focus-within {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--glow2);
      }
      mat-icon { color: var(--muted); font-size: 1rem; width: 1rem; height: 1rem; flex-shrink: 0; }
    }

    .loc-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--text);
      font-family: 'Syne', sans-serif;
      font-size: 0.875rem;
      &::placeholder { color: var(--muted); }
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0 1rem;
      height: 40px;
      background: rgba(124,111,255,0.12);
      border: 1px solid rgba(124,111,255,0.3);
      border-radius: 8px;
      color: var(--accent);
      font-family: 'Syne', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &:hover:not(:disabled) { background: rgba(124,111,255,0.2); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .loc-empty {
      font-size: 0.8rem;
      color: var(--muted);
      padding: 0.5rem 0;
      font-style: italic;
    }

    .locations-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .loc-card {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.5rem 0.375rem 0.875rem;
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: 8px;
      transition: all 0.2s;
      &:hover { border-color: var(--danger); }
    }

    .loc-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text2);
    }

    .loc-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      background: none;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: var(--muted);
      padding: 0;
      transition: all 0.15s;
      mat-icon { font-size: 0.875rem; width: 0.875rem; height: 0.875rem; }
      &:hover { background: var(--danger-bg); color: var(--danger); }
    }

    /* Actions */
    .settings-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .save-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1.5rem;
      height: 44px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border: none;
      border-radius: 10px;
      color: white;
      font-family: 'Syne', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s, box-shadow 0.2s, transform 0.1s;
      box-shadow: 0 3px 14px var(--glow);
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
      &:hover { opacity: 0.9; box-shadow: 0 5px 20px var(--glow); }
      &:active { transform: scale(0.98); }
    }

    .scan-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1.25rem;
      height: 44px;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 10px;
      color: var(--text2);
      font-family: 'Syne', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
      &:hover:not(:disabled) { border-color: var(--success); color: var(--success); background: var(--success-bg); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private svc      = inject(SettingsService);
  private snackBar = inject(MatSnackBar);

  protected form = this.fb.group({
    isEnabled:       [false],
    intervalMinutes: [360]
  });

  protected locations   = signal<string[]>([]);
  protected newLocation = '';
  protected scanning    = signal(false);

  protected intervalOptions = [
    { value: 60,   label: '1 hora' },
    { value: 360,  label: '6 horas' },
    { value: 720,  label: '12 horas' },
    { value: 1440, label: '24 horas' }
  ];

  ngOnInit(): void {
    this.svc.get().subscribe(s => {
      this.form.patchValue({ isEnabled: s.isEnabled, intervalMinutes: s.intervalMinutes });
      this.locations.set(s.watchedLocations);
    });
  }

  protected addLocation(): void {
    const loc = this.newLocation.trim();
    if (!loc || this.locations().includes(loc)) return;
    this.locations.update(list => [...list, loc]);
    this.newLocation = '';
  }

  protected removeLocation(loc: string): void {
    this.locations.update(list => list.filter(l => l !== loc));
  }

  protected save(): void {
    const v = this.form.value;
    this.svc.update({
      isEnabled:        v.isEnabled ?? false,
      intervalMinutes:  v.intervalMinutes ?? 360,
      watchedLocations: this.locations()
    }).subscribe({
      next: () => this.snackBar.open('✓ Configurações salvas', '', { duration: 2500 }),
      error: () => this.snackBar.open('Erro ao salvar. Backend acessível?', 'OK', { duration: 4000 })
    });
  }

  protected scanNow(): void {
    this.scanning.set(true);
    this.svc.scanNow().subscribe({
      next: r  => { this.snackBar.open(`✓ ${r.message}`, '', { duration: 4000 }); this.scanning.set(false); },
      error: () => { this.snackBar.open('Erro ao iniciar varredura.', 'OK', { duration: 3000 }); this.scanning.set(false); }
    });
  }
}

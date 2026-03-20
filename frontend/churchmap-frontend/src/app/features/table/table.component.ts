import {
  AfterViewInit, Component, effect, input, output, ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Church } from '../../core/models';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    FormsModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatTableModule, MatSortModule, MatPaginatorModule
  ],
  template: `
    <div class="table-page">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="page-title">
          <span>📋</span>
          <div>
            <h2>Tabela</h2>
            <p>{{ dataSource.filteredData.length }} resultados</p>
          </div>
        </div>

        <div class="toolbar-actions">
          <div class="filter-box" [class.active]="filterText">
            <mat-icon>search</mat-icon>
            <input [(ngModel)]="filterText" (ngModelChange)="applyFilter()"
                   placeholder="Filtrar por nome, bairro..." />
            @if (filterText) {
              <button class="clear-btn" (click)="filterText = ''; applyFilter()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
          <button class="export-btn" (click)="exportCsv()" [disabled]="dataSource.data.length === 0">
            <mat-icon>download</mat-icon>
            <span>CSV</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nome</th>
            <td mat-cell *matCellDef="let c">
              <span class="church-name-link">
                {{ c.name }}
                <mat-icon>place</mat-icon>
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="denomination">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Denominação</th>
            <td mat-cell *matCellDef="let c">
              @if (c.denomination) {
                <span class="chip">{{ c.denomination }}</span>
              } @else {
                <span class="muted">—</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="address">
            <th mat-header-cell *matHeaderCellDef>Endereço</th>
            <td mat-cell *matCellDef="let c">
              <span class="address">{{ buildAddress(c) || '—' }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="suburb">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Bairro</th>
            <td mat-cell *matCellDef="let c">{{ c.suburb || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="coords">
            <th mat-header-cell *matHeaderCellDef>Coordenadas</th>
            <td mat-cell *matCellDef="let c">
              <span class="mono coords">{{ c.lat.toFixed(5) }}, {{ c.lon.toFixed(5) }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="osmId">
            <th mat-header-cell *matHeaderCellDef>OSM</th>
            <td mat-cell *matCellDef="let c">
              <a [href]="'https://www.openstreetmap.org/node/' + c.id"
                 target="_blank" class="osm-link">
                <mat-icon>open_in_new</mat-icon>
                {{ c.id }}
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"
              [class.selected-row]="selectedId === row.id"
              (click)="selectChurch(row)" style="cursor:pointer"></tr>

          <tr *matNoDataRow>
            <td [attr.colspan]="cols.length">
              <div class="no-data">
                @if (filterText) {
                  <span>Nenhum resultado para <strong>{{ filterText }}</strong></span>
                } @else {
                  <span>Faça uma busca para listar igrejas</span>
                }
              </div>
            </td>
          </tr>
        </table>
      </div>

      <mat-paginator [pageSizeOptions]="[25, 50, 100]" pageSize="50"
                     showFirstLastButtons class="table-paginator" />
    </div>
  `,
  styles: [`
    .table-page {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 170px);
      animation: fade-in 0.3s ease;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.4rem;
    }

    h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text); }
    p  { margin: 0; font-size: 0.75rem; color: var(--muted); }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .filter-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.875rem;
      height: 38px;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 8px;
      min-width: 240px;
      transition: border-color 0.2s, box-shadow 0.2s;

      &.active, &:focus-within {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--glow2);
      }

      mat-icon { color: var(--muted); font-size: 1rem; width: 1rem; height: 1rem; flex-shrink: 0; }

      input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: var(--text);
        font-family: 'Syne', sans-serif;
        font-size: 0.85rem;
        &::placeholder { color: var(--muted); }
      }
    }

    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted);
      display: flex;
      padding: 2px;
      border-radius: 4px;
      transition: color 0.2s;
      mat-icon { font-size: 0.9rem; width: 0.9rem; height: 0.9rem; }
      &:hover { color: var(--text); }
    }

    .export-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0 0.875rem;
      height: 38px;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 8px;
      color: var(--text2);
      font-family: 'Syne', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.04em;
      mat-icon { font-size: 0.9rem; width: 0.9rem; height: 0.9rem; }
      &:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: var(--glow2); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    /* Table */
    .table-container {
      flex: 1;
      overflow: auto;
      background: var(--surface);
    }

    .church-name { font-weight: 600; color: var(--text); }
    .address     { font-size: 0.82rem; color: var(--text2); }
    .muted       { color: var(--muted); }

    .chip {
      display: inline-block;
      padding: 2px 8px;
      background: rgba(124,111,255,0.1);
      border: 1px solid rgba(124,111,255,0.2);
      border-radius: 6px;
      font-size: 0.72rem;
      color: var(--accent);
      white-space: nowrap;
    }

    .coords {
      font-size: 0.78rem;
      color: var(--text2);
      letter-spacing: 0.01em;
    }

    .osm-link {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      color: var(--accent);
      text-decoration: none;
      font-size: 0.78rem;
      font-family: 'DM Mono', monospace;
      transition: opacity 0.2s;
      mat-icon { font-size: 0.8rem; width: 0.8rem; height: 0.8rem; }
      &:hover { opacity: 0.75; }
    }

    .no-data {
      text-align: center;
      padding: 3rem;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .table-paginator { background: var(--surface) !important; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    .selected-row td { background: rgba(124,111,255,0.08) !important; }
    .church-name-link {
      font-weight: 600;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.375rem;
      &:hover { color: var(--accent); }
      mat-icon { font-size: 0.85rem; width: 0.85rem; height: 0.85rem; opacity: 0; transition: opacity 0.15s; }
    }
    tr:hover .church-name-link mat-icon { opacity: 0.7; }
  `]
})
export class TableComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  churches      = input<Church[]>([]);
  churchSelect  = output<Church>();

  protected cols = ['name', 'denomination', 'address', 'suburb', 'coords', 'osmId'];
  protected dataSource = new MatTableDataSource<Church>([]);
  protected filterText = '';
  protected selectedId: number | null = null;

  constructor() {
    effect(() => {
      this.dataSource.data = this.churches();
      this.selectedId = null;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
    this.sort.sort({ id: 'name', start: 'asc', disableClear: false });
  }

  protected selectChurch(c: Church): void {
    this.selectedId = c.id;
    this.churchSelect.emit(c);
  }

  protected applyFilter(): void {
    this.dataSource.filter = this.filterText.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  protected buildAddress(c: Church): string {
    return [c.street, c.houseNumber, c.city].filter(Boolean).join(', ');
  }

  protected exportCsv(): void {
    const rows = [
      ['Nome', 'Denominacao', 'Endereco', 'Bairro', 'Lat', 'Lon', 'OSM_ID'],
      ...this.dataSource.filteredData.map(c => [
        c.name, c.denomination ?? '', this.buildAddress(c), c.suburb ?? '',
        c.lat, c.lon, c.id
      ])
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'churches.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

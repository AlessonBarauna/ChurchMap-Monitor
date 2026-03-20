import { Component, inject, input, OnChanges } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Snapshot } from '../../core/models';
import { SnapshotService } from '../../core/services/snapshot.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DatePipe, DecimalPipe, BaseChartDirective],
  template: `
    <div class="history-page">
      <!-- Header -->
      <div class="page-header">
        <span>📈</span>
        <div>
          <h2>Histórico</h2>
          <p>Evolução do número de igrejas por varredura</p>
        </div>
      </div>

      @if (snapshots.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>Sem dados ainda</h3>
          <p>Faça uma busca para começar a gerar o histórico.<br>
             O gráfico mostrará a evolução ao longo do tempo.</p>
        </div>
      } @else {

        <!-- Chart Card -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Total de igrejas por varredura</span>
            <span class="chart-loc">{{ snapshots[0].locationLabel }}</span>
          </div>
          <div class="chart-wrap">
            <canvas baseChart [data]="chartData" [options]="chartOptions" type="line"></canvas>
          </div>
        </div>

        <!-- Table -->
        <div class="snap-section">
          <h3 class="section-title">Varreduras registradas</h3>
          <div class="snap-table-wrap">
            <table class="snap-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Variação</th>
                  <th>Localização</th>
                </tr>
              </thead>
              <tbody>
                @for (s of snapshots; track s.id; let i = $index) {
                  <tr>
                    <td class="mono">{{ s.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                    <td class="mono total">{{ s.totalCount | number }}</td>
                    <td>
                      <span class="delta" [class]="getDeltaClass(i)">
                        {{ getDelta(i) }}
                      </span>
                    </td>
                    <td>{{ s.locationLabel }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .history-page {
      padding: 1.5rem;
      animation: fade-in 0.3s ease;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      font-size: 1.4rem;
    }

    h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text); }
    p  { margin: 0; font-size: 0.8rem; color: var(--muted); }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 5rem 2rem;
      animation: fade-in 0.5s ease;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.4; }
    .empty-state h3 { margin: 0 0 0.5rem; color: var(--text2); }
    .empty-state p { color: var(--muted); line-height: 1.6; }

    /* Chart */
    .chart-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }

    .chart-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .chart-loc {
      font-size: 0.8rem;
      color: var(--accent);
      font-family: 'DM Mono', monospace;
    }

    .chart-wrap {
      padding: 1.5rem;
      height: 260px;
      position: relative;
    }

    /* Table */
    .snap-section { margin-top: 0.5rem; }

    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0 0 0.75rem;
    }

    .snap-table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .snap-table {
      width: 100%;
      border-collapse: collapse;
    }

    .snap-table th {
      padding: 0.625rem 1.25rem;
      text-align: left;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--border);
    }

    .snap-table td {
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      color: var(--text2);
      border-bottom: 1px solid var(--border);
    }

    .snap-table tr:last-child td { border-bottom: none; }
    .snap-table tr:hover td { background: var(--glow2); }

    .mono { font-family: 'DM Mono', monospace; }
    .total { color: var(--text); font-weight: 600; }

    .delta {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-family: 'DM Mono', monospace;
      font-weight: 700;

      &.pos  { background: var(--success-bg); color: var(--success); }
      &.neg  { background: var(--danger-bg);  color: var(--danger); }
      &.zero { color: var(--muted); }
    }
  `]
})
export class HistoryComponent implements OnChanges {
  locationKey = input('');

  private snapshotService = inject(SnapshotService);
  protected snapshots: Snapshot[] = [];

  chartData: ChartData<'line'> = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(7,7,16,0.95)',
        borderColor: 'rgba(124,111,255,0.3)',
        borderWidth: 1,
        titleColor: '#f0eeff',
        bodyColor: '#a8a4cc',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        ticks: { color: '#5a5680', font: { family: 'DM Mono', size: 11 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: 'rgba(255,255,255,0.06)' }
      },
      y: {
        ticks: { color: '#5a5680', font: { family: 'DM Mono', size: 11 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: 'rgba(255,255,255,0.06)' }
      }
    }
  };

  ngOnChanges(): void {
    const key = this.locationKey();
    if (!key) return;
    this.snapshotService.getAll(key).subscribe(list => {
      this.snapshots = list;
      this.buildChart(list);
    });
  }

  private buildChart(list: Snapshot[]): void {
    const sorted = [...list].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    this.chartData = {
      labels: sorted.map(s => new Date(s.createdAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      })),
      datasets: [{
        label: 'Igrejas',
        data: sorted.map(s => s.totalCount),
        borderColor: '#7c6fff',
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, 'rgba(124,111,255,0.25)');
          gradient.addColorStop(1, 'rgba(124,111,255,0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c6fff',
        pointBorderColor: 'rgba(7,7,16,0.8)',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    };
  }

  protected getDelta(i: number): string {
    if (i === this.snapshots.length - 1) return '—';
    const d = this.snapshots[i].totalCount - this.snapshots[i + 1].totalCount;
    return d > 0 ? `+${d}` : d < 0 ? `${d}` : '=';
  }

  protected getDeltaClass(i: number): string {
    if (i === this.snapshots.length - 1) return 'zero';
    const d = this.snapshots[i].totalCount - this.snapshots[i + 1].totalCount;
    return d > 0 ? 'pos' : d < 0 ? 'neg' : 'zero';
  }
}

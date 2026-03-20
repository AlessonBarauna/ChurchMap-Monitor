import {
  AfterViewInit, Component, effect, ElementRef,
  input, OnDestroy, ViewChild
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Church, DiffResult } from '../../core/models';

type LayerId = 'dark' | 'satellite' | 'topo' | 'street';

const LAYERS: { id: LayerId; label: string; icon: string }[] = [
  { id: 'dark',      label: 'Escuro',    icon: '🌑' },
  { id: 'satellite', label: 'Satélite',  icon: '🛰️' },
  { id: 'topo',      label: 'Relevo',    icon: '⛰️' },
  { id: 'street',    label: 'Ruas',      icon: '🗺️' },
];

@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <div class="map-wrap">
      <div #mapContainer class="map-container"></div>

      <!-- Layer switcher -->
      <div class="layer-switcher">
        @for (l of layers; track l.id) {
          <button class="layer-btn" [class.active]="activeLayer === l.id"
                  (click)="setLayer(l.id)" [title]="l.label">
            <span class="layer-icon">{{ l.icon }}</span>
            <span class="layer-label">{{ l.label }}</span>
          </button>
        }
      </div>

      <!-- Legend -->
      <div class="map-legend">
        <div class="legend-item"><span class="dot normal"></span><span>Igreja</span></div>
        <div class="legend-item"><span class="dot new"></span><span>Nova</span></div>
        <div class="legend-item"><span class="dot closed"></span><span>Fechada</span></div>
      </div>

      <!-- Empty state -->
      @if (churches().length === 0) {
        <div class="map-empty">
          <div class="map-empty-content">
            <div class="map-empty-icon">🗺️</div>
            <p>Faça uma busca para visualizar as igrejas no mapa</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .map-wrap {
      position: relative;
      height: calc(100vh - 170px);
    }

    .map-container {
      width: 100%;
      height: 100%;
      background: var(--bg);
    }

    /* Layer switcher */
    .layer-switcher {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: rgba(7,7,16,0.92);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border2);
      border-radius: 10px;
      padding: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }

    .layer-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border: 1px solid transparent;
      border-radius: 7px;
      background: transparent;
      color: var(--muted);
      font-family: 'Syne', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;

      &:hover { background: var(--surface2); color: var(--text2); }

      &.active {
        background: rgba(124,111,255,0.15);
        border-color: rgba(124,111,255,0.35);
        color: var(--accent);
      }
    }

    .layer-icon { font-size: 0.9rem; line-height: 1; }
    .layer-label { font-size: 0.72rem; }

    /* Legend */
    .map-legend {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(7,7,16,0.9);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border2);
      border-radius: var(--radius);
      font-size: 0.78rem;
      color: var(--text2);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Syne', sans-serif;
      font-weight: 600;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      &.normal { background: #7c6fff; box-shadow: 0 0 6px rgba(124,111,255,0.6); }
      &.new    { background: #00e5b0; box-shadow: 0 0 6px rgba(0,229,176,0.6); }
      &.closed { background: #ff5f7e; box-shadow: 0 0 6px rgba(255,95,126,0.6); }
    }

    /* Empty */
    .map-empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(7,7,16,0.95), rgba(13,13,26,0.9));
      z-index: 998;
      pointer-events: none;
    }

    .map-empty-content { text-align: center; animation: fade-in 0.5s ease; }
    .map-empty-icon { font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.5; filter: grayscale(0.5); }
    .map-empty-content p { color: var(--muted); font-size: 0.9rem; font-family: 'Syne', sans-serif; margin: 0; }
  `]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  churches        = input<Church[]>([]);
  diff            = input<DiffResult | null>(null);
  highlightChurch = input<Church | null>(null);

  protected layers     = LAYERS;
  protected activeLayer: LayerId = 'dark';

  private map!: L.Map;
  private clusterGroup!: L.MarkerClusterGroup;
  private markerById   = new Map<number, L.CircleMarker>();
  private baseLayers!: Record<LayerId, L.TileLayer>;

  constructor() {
    effect(() => {
      const list = this.churches();
      const d    = this.diff();
      if (this.map) this.renderMarkers(list, d);
    });

    effect(() => {
      const c = this.highlightChurch();
      if (!c || !this.map) return;
      const marker = this.markerById.get(c.id);
      if (!marker) return;
      (this.clusterGroup as any).zoomToShowLayer(marker, () => {
        this.map.setView(marker.getLatLng(), Math.max(this.map.getZoom(), 16), { animate: true });
        marker.openPopup();
      });
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [-15.78, -47.93],
      zoom: 5,
      zoomControl: false,
      attributionControl: true
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // ── Camadas base ──────────────────────────────────────────────────────────
    this.baseLayers = {
      dark: L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution: '© <a href="https://openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>', maxZoom: 19, subdomains: 'abcd' }
      ),
      satellite: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© <a href="https://www.esri.com">Esri</a> World Imagery', maxZoom: 19 }
      ),
      topo: L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        { attribution: '© <a href="https://openstreetmap.org">OSM</a> © <a href="https://opentopomap.org">OpenTopoMap</a>', maxZoom: 17, subdomains: 'abc' }
      ),
      street: L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors', maxZoom: 19 }
      ),
    };

    this.baseLayers.dark.addTo(this.map);

    // ── Cluster ───────────────────────────────────────────────────────────────
    this.clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const size  = count < 10 ? 32 : count < 50 ? 38 : 44;
        return L.divIcon({
          html: `<div class="cluster-icon" style="width:${size}px;height:${size}px">${count}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });
      }
    });

    this.clusterGroup.addTo(this.map);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  protected setLayer(id: LayerId): void {
    if (id === this.activeLayer) return;
    this.map.removeLayer(this.baseLayers[this.activeLayer]);
    this.baseLayers[id].addTo(this.map);
    this.baseLayers[id].bringToBack();
    this.activeLayer = id;
  }

  private renderMarkers(churches: Church[], diff: DiffResult | null): void {
    this.clusterGroup.clearLayers();
    this.markerById.clear();

    const newIds    = new Set((diff?.newChurches    ?? []).map(c => c.id));
    const closedIds = new Set((diff?.closedChurches ?? []).map(c => c.id));

    for (const c of churches) {
      const isNew    = newIds.has(c.id);
      const isClosed = closedIds.has(c.id);

      const color  = isNew ? '#00e5b0' : isClosed ? '#ff5f7e' : '#7c6fff';
      const radius = isNew || isClosed ? 9 : 7;

      const marker = L.circleMarker([c.lat, c.lon], {
        radius,
        fillColor: color,
        color: 'rgba(0,0,0,0.4)',
        weight: 1.5,
        fillOpacity: 0.9
      });

      const address   = [c.street, c.houseNumber, c.suburb, c.city].filter(Boolean).join(', ');
      const typeBadge = isNew
        ? `<span style="background:rgba(0,229,176,0.15);color:#00e5b0;padding:2px 8px;border-radius:6px;font-size:0.7rem;font-weight:700">✦ NOVA</span>`
        : isClosed
        ? `<span style="background:rgba(255,95,126,0.15);color:#ff5f7e;padding:2px 8px;border-radius:6px;font-size:0.7rem;font-weight:700">✕ FECHADA</span>`
        : '';

      const streetViewUrl = `https://www.google.com/maps?q=&layer=c&cbll=${c.lat},${c.lon}&cbp=`;

      marker.bindPopup(`
        <div style="padding:1rem;min-width:190px;font-family:'Syne',sans-serif">
          ${typeBadge ? `<div style="margin-bottom:0.5rem">${typeBadge}</div>` : ''}
          <div style="font-size:0.95rem;font-weight:700;color:#f0eeff;margin-bottom:0.25rem">${c.name}</div>
          ${c.denomination ? `<div style="font-size:0.75rem;color:#a8a4cc;margin-bottom:0.5rem">${c.denomination}</div>` : ''}
          ${address ? `<div style="font-size:0.75rem;color:#7a78a0;margin-bottom:0.5rem">📍 ${address}</div>` : ''}
          <div style="font-size:0.7rem;color:#5a5680;font-family:'DM Mono',monospace;margin-bottom:0.5rem">ID: ${c.id}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:0.25rem">
            <a href="https://www.openstreetmap.org/node/${c.id}" target="_blank"
               style="flex:1;text-align:center;padding:4px 8px;background:rgba(124,111,255,0.12);border:1px solid rgba(124,111,255,0.25);border-radius:6px;font-size:0.72rem;color:#7c6fff;text-decoration:none;font-weight:600">
              OSM
            </a>
            <a href="${streetViewUrl}" target="_blank"
               style="flex:1;text-align:center;padding:4px 8px;background:rgba(0,180,255,0.1);border:1px solid rgba(0,180,255,0.2);border-radius:6px;font-size:0.72rem;color:#00b4ff;text-decoration:none;font-weight:600">
              Street View
            </a>
          </div>
        </div>
      `, { className: 'custom-popup', maxWidth: 280 });

      this.markerById.set(c.id, marker);
      this.clusterGroup.addLayer(marker);
    }

    if (churches.length > 0) {
      const coords = churches.map(c => [c.lat, c.lon] as [number, number]);
      this.map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 13 });
    }
  }
}

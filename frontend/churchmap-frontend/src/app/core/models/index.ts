export interface Church {
  id: number;
  name: string;
  lat: number;
  lon: number;
  denomination?: string;
  street?: string;
  houseNumber?: string;
  suburb?: string;
  city?: string;
  tags?: Record<string, string>;
}

export interface Snapshot {
  id: number;
  locationKey: string;
  locationLabel: string;
  createdAt: string;
  totalCount: number;
}

export interface NotificationRecord {
  id: number;
  type: 'new' | 'closed';
  churchOsmId: number;
  churchName: string;
  locationKey: string;
  locationLabel: string;
  address?: string;
  createdAt: string;
  isRead: boolean;
}

export interface DiffResult {
  newChurches: Church[];
  closedChurches: Church[];
}

export interface SearchResult {
  snapshot: Snapshot;
  elements: Church[];
  diff: DiffResult | null;
}

export interface MonitorSettings {
  isEnabled: boolean;
  intervalMinutes: number;
  watchedLocations: string[];
}

export interface AppStats {
  total: number;
  newCount: number;
  closedCount: number;
  lastScan: string;
}

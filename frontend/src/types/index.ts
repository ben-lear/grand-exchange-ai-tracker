export interface Item {
  id: number;
  item_id: number;
  name: string;
  description: string;
  icon_url: string;
  icon_large_url: string;
  type: string;
  members: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: number;
  item_id: number;
  timestamp: number;
  price: number;
  volume?: number;
  created_at: string;
}

export interface PriceTrend {
  id: number;
  item_id: number;
  current_price: number;
  current_trend: 'positive' | 'negative' | 'neutral';
  today_price_change: number;
  today_trend: 'positive' | 'negative' | 'neutral';
  day30_change: string;
  day30_trend: 'positive' | 'negative' | 'neutral';
  day90_change: string;
  day90_trend: 'positive' | 'negative' | 'neutral';
  day180_change: string;
  day180_trend: 'positive' | 'negative' | 'neutral';
  updated_at: string;
}

export interface ItemDetail extends Item {
  trend?: PriceTrend;
  price_trend?: PriceTrend;
  price_history?: PriceHistory[];
}

export interface OSRSAPIItemResponse {
  icon: string;
  icon_large: string;
  id: number;
  type: string;
  typeIcon: string;
  name: string;
  description: string;
  current: {
    trend: string;
    price: string | number;
  };
  today: {
    trend: string;
    price: string | number;
  };
  members: string;
}

export interface OSRSAPIGraphResponse {
  daily: Record<string, number>;
  average: Record<string, number>;
}

// ===== API Response Types =====
export interface APIResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PriceGraphData {
  timestamps: number[];
  prices: number[];
  averages?: number[];
}

export interface TrendingItem {
  item: Item;
  trend: PriceTrend;
  volume_change: number;
  price_change_percent: number;
}

export interface BiggestMover {
  item: Item;
  trend: PriceTrend;
  price_change: number;
  price_change_percent: number;
}

export interface StatsResponse {
  total_items: number;
  total_tracked: number;
  last_update: string;
}

// ===== Filter & Search Types =====
export interface ItemFilters {
  search: string;
  type: string;
  members: boolean | null;
  sortBy: 'name' | 'price' | 'item_id';
  sortOrder: 'asc' | 'desc';
}

export type TimeRange = '7d' | '30d' | '90d' | '180d';

export type TrendDirection = 'positive' | 'negative' | 'neutral';

// ===== UI State Types =====
export interface AppSettings {
  theme: 'dark' | 'light';
  chartType: 'line' | 'area';
  showVolume: boolean;
  refreshInterval: number;
}

export interface WatchlistItem {
  itemId: number;
  addedAt: string;
}

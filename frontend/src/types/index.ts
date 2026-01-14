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

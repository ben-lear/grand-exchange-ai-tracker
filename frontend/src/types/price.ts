/**
 * Price type definitions for OSRS Grand Exchange prices
 */

/**
 * Trend direction for price changes
 */
export type PriceTrend = 'positive' | 'negative' | 'neutral';

/**
 * Current price data for an item
 */
export interface CurrentPrice {
  /** Database primary key */
  id: number;
  /** OSRS item ID */
  itemId: number;
  /** Current price in GP */
  price: number;
  /** High price in GP */
  highPrice: number;
  /** Low price in GP */
  lowPrice: number;
  /** Trading volume */
  volume: number;
  /** Price change over 24 hours in GP */
  priceChange24h: number;
  /** Price change percentage over 24 hours */
  priceChangePercent24h: number;
  /** Trend indicator */
  trend: PriceTrend;
  /** When this price was last updated */
  lastUpdated: string;
  /** When this record was created */
  createdAt: string;
  /** When this record was last modified */
  updatedAt: string;
}

/**
 * Single data point in price history
 */
export interface PricePoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Price in GP */
  price: number;
  /** Trading volume (if available) */
  volume?: number;
  /** Previous price point (if available) */
  previousPrice?: number;
}

/**
 * Historical price data for an item
 */
export interface PriceHistory {
  itemId: number;
  /** Time period of the data */
  period: TimePeriod;
  /** Array of price points */
  data: PricePoint[];
  /** Statistical summary */
  summary: {
    /** Average price over the period */
    avgPrice: number;
    /** Highest price in the period */
    maxPrice: number;
    /** Lowest price in the period */
    minPrice: number;
    /** Total volume traded */
    totalVolume: number;
    /** Price change from start to end */
    priceChange: number;
    /** Percentage change from start to end */
    priceChangePercent: number;
  };
}

/**
 * Time period options for historical data
 */
export type TimePeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Batch price request
 */
export interface BatchPriceRequest {
  /** Array of item IDs (max 100) */
  itemIds: number[];
}

/**
 * Batch price response
 */
export interface BatchPriceResponse {
  prices: CurrentPrice[];
  /** Number of items found */
  count: number;
  /** Number of items requested */
  requested: number;
}

/**
 * Price change statistics
 */
export interface PriceStatistics {
  /** Current price */
  current: number;
  /** 24-hour statistics */
  day: {
    high: number;
    low: number;
    avg: number;
    change: number;
    changePercent: number;
  };
  /** 7-day statistics */
  week: {
    high: number;
    low: number;
    avg: number;
    change: number;
    changePercent: number;
  };
  /** 30-day statistics */
  month: {
    high: number;
    low: number;
    avg: number;
    change: number;
    changePercent: number;
  };
  /** All-time statistics */
  allTime: {
    high: number;
    low: number;
    highDate: string;
    lowDate: string;
  };
}

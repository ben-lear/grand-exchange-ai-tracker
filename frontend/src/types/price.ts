/**
 * Price type definitions for OSRS Grand Exchange prices
 */

/**
 * Trend direction for price changes (computed on frontend)
 */
export type PriceTrend = 'positive' | 'negative' | 'neutral';

/**
 * Current price data for an item from the Wiki API
 * Represents instant-buy (high) and instant-sell (low) prices
 */
export interface CurrentPrice {
  /** OSRS item ID */
  itemId: number;
  /** Instant-buy price in GP (nullable if no recent trades) */
  highPrice: number | null;
  /** Timestamp of the high price observation */
  highPriceTime: string | null;
  /** Instant-sell price in GP (nullable if no recent trades) */
  lowPrice: number | null;
  /** Timestamp of the low price observation */
  lowPriceTime: string | null;
  /** When this record was last updated */
  updatedAt: string;
}

/**
 * Helper to calculate spread (margin) between high and low prices
 */
export interface PriceSpread {
  /** Absolute spread in GP (high - low) */
  spreadGP: number;
  /** Spread as percentage of low price */
  spreadPercent: number;
}

/**
 * Single data point in price history (timeseries)
 * Backend provides bucketed averages with volume per direction
 */
export interface PricePoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Average high (instant-buy) price for the bucket */
  avgHighPrice?: number | null;
  /** Average low (instant-sell) price for the bucket */
  avgLowPrice?: number | null;
  /** Volume of high price trades (buy offers) */
  highPriceVolume?: number;
  /** Volume of low price trades (sell offers) */
  lowPriceVolume?: number;
  /** Legacy fields for backward compatibility */
  highPrice?: number | null;
  lowPrice?: number | null;
  /** Computed average price (for single-line charts) */
  price?: number;
  /** Computed total volume */
  volume?: number;
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
 * Time period options for historical data (matches backend TimePeriod enum)
 */
export type TimePeriod = '1h' | '12h' | '24h' | '3d' | '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Batch price response (from GET /prices/current/batch?ids=...)
 */
export interface BatchPriceResponse {
  /** Array of current prices */
  data: CurrentPrice[];
  /** Metadata about the request */
  meta: {
    /** Number of items requested */
    requested: number;
    /** Number of items found */
    found: number;
  };
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

/**
 * API functions for price-related endpoints
 */

import apiClient from './client';
import type {
  CurrentPrice,
  PriceHistory,
  BatchPriceResponse,
  TimePeriod,
} from '../types';

/**
 * Fetch all current prices
 */
export const fetchAllCurrentPrices = async (): Promise<CurrentPrice[]> => {
  const response = await apiClient.get<{ data: CurrentPrice[]; meta: { count: number } }>('/prices/current');
  return response.data.data;
};

/**
 * Fetch current price for a single item
 */
export const fetchCurrentPrice = async (itemId: number): Promise<CurrentPrice> => {
  const response = await apiClient.get<{ data: CurrentPrice }>(`/prices/current/${itemId}`);
  return response.data.data;
};

/**
 * Fetch current prices for multiple items (batch request)
 * Maximum 100 items per request
 * Backend uses GET with query params: /prices/current/batch?ids=1,2,3
 */
export const fetchBatchCurrentPrices = async (
  itemIds: number[]
): Promise<BatchPriceResponse> => {
  if (itemIds.length > 100) {
    throw new Error('Cannot request more than 100 items at once');
  }
  
  const idsParam = itemIds.join(',');
  const response = await apiClient.get<BatchPriceResponse>(
    `/prices/current/batch?ids=${idsParam}`
  );
  return response.data;
};

/**
 * Fetch historical price data for an item
 * Backend returns timeseries with avgHighPrice, avgLowPrice, and volumes
 */
export const fetchPriceHistory = async (
  itemId: number,
  period: TimePeriod = '7d',
  sample?: number
): Promise<PriceHistory> => {
  const params: Record<string, string | number> = { period };
  if (sample !== undefined) {
    params.sample = sample;
  }
  
  const response = await apiClient.get<{ 
    data: Array<{
      timestamp: string;
      // Backend uses different field names based on source:
      // - timeseries tables: avgHighPrice, avgLowPrice
      // - daily table: highPrice, lowPrice
      avgHighPrice?: number | null;
      avgLowPrice?: number | null;
      highPrice?: number | null;
      lowPrice?: number | null;
      highPriceVolume?: number;
      lowPriceVolume?: number;
    }>; 
    meta: { 
      item_id: number;
      period: string;
      count: number;
      first_date?: string;
      last_date?: string;
      sampled?: boolean;
    } 
  }>(`/prices/history/${itemId}`, { params });
  
  // Transform backend response to match frontend PriceHistory interface
  const backendData = response.data.data;
  
  // Convert backend format to frontend format
  const data = backendData.map(point => {
    // Backend may return either avgHighPrice/avgLowPrice (timeseries) or highPrice/lowPrice (daily)
    const highValue = point.avgHighPrice ?? point.highPrice ?? null;
    const lowValue = point.avgLowPrice ?? point.lowPrice ?? null;
    
    // Calculate average price: if both exist, average them; otherwise use whichever exists
    let avgPrice = 0;
    if (highValue !== null && lowValue !== null) {
      avgPrice = (highValue + lowValue) / 2;
    } else if (highValue !== null) {
      avgPrice = highValue;
    } else if (lowValue !== null) {
      avgPrice = lowValue;
    }
    
    const totalVolume = (point.highPriceVolume ?? 0) + (point.lowPriceVolume ?? 0);
    
    return {
      timestamp: new Date(point.timestamp).getTime(),
      avgHighPrice: highValue,
      avgLowPrice: lowValue,
      highPrice: highValue, // Normalized field name
      lowPrice: lowValue,   // Normalized field name
      highPriceVolume: point.highPriceVolume,
      lowPriceVolume: point.lowPriceVolume,
      price: avgPrice, // Computed average for single-line charts
      volume: totalVolume, // Computed total volume
    };
  });
  
  // Calculate summary statistics from the data
  const prices = data.map(point => point.price || 0).filter(p => p > 0);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const firstPrice = prices[0] || 0;
  const lastPrice = prices[prices.length - 1] || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const totalVolume = data.reduce((sum, point) => sum + (point.volume || 0), 0);
  
  return {
    itemId: response.data.meta.item_id,
    period: response.data.meta.period as TimePeriod,
    data: data,
    summary: {
      avgPrice,
      maxPrice,
      minPrice,
      totalVolume,
      priceChange,
      priceChangePercent,
    },
  };
};

/**
 * Manually trigger a sync of current prices (admin endpoint)
 * Backend endpoint: POST /api/v1/sync/prices
 */
export const syncCurrentPrices = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/sync/prices'
  );
  return response.data;
};

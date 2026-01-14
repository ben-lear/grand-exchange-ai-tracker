/**
 * API functions for price-related endpoints
 */

import apiClient from './client';
import type {
  CurrentPrice,
  PriceHistory,
  BatchPriceRequest,
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
 */
export const fetchBatchCurrentPrices = async (
  itemIds: number[]
): Promise<BatchPriceResponse> => {
  if (itemIds.length > 100) {
    throw new Error('Cannot request more than 100 items at once');
  }
  
  const request: BatchPriceRequest = { itemIds };
  const response = await apiClient.post<BatchPriceResponse>('/prices/batch', request);
  return response.data;
};

/**
 * Fetch historical price data for an item
 */
export const fetchPriceHistory = async (
  itemId: number,
  period: TimePeriod = '7d',
  sample?: boolean
): Promise<PriceHistory> => {
  const response = await apiClient.get<{ 
    data: Array<{
      timestamp: string;
      highPrice: number;
      lowPrice: number;
    }>; 
    meta: { 
      item_id: number;
      period: string;
      count: number;
      first_date?: string;
      last_date?: string;
      sampled?: boolean;
    } 
  }>(`/prices/history/${itemId}`, {
    params: { period, sample },
  });
  
  // Transform backend response to match frontend PriceHistory interface
  const backendData = response.data.data;
  
  // Convert backend format to frontend format
  const data = backendData.map(point => ({
    timestamp: new Date(point.timestamp).getTime(), // Convert to milliseconds
    price: point.highPrice || point.lowPrice || 0, // Use high price as primary
    volume: undefined, // Backend doesn't provide volume in history
  }));
  
  // Calculate summary statistics from the data
  const prices = data.map(point => point.price || 0);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices.filter(p => p > 0)) : 0;
  const firstPrice = prices[0] || 0;
  const lastPrice = prices[prices.length - 1] || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  
  return {
    itemId: response.data.meta.item_id,
    period: response.data.meta.period as TimePeriod,
    data: data,
    summary: {
      avgPrice,
      maxPrice,
      minPrice,
      totalVolume: 0, // Backend doesn't provide volume in history
      priceChange,
      priceChangePercent,
    },
  };
};

/**
 * Manually trigger a sync of current prices (admin endpoint)
 */
export const syncCurrentPrices = async (): Promise<{ message: string; count: number }> => {
  const response = await apiClient.post<{ message: string; count: number }>(
    '/prices/sync/current'
  );
  return response.data;
};

/**
 * Manually trigger a sync of historical prices (admin endpoint)
 */
export const syncHistoricalPrices = async (
  itemIds?: number[]
): Promise<{ message: string; count: number }> => {
  const response = await apiClient.post<{ message: string; count: number }>(
    '/prices/sync/historical',
    { itemIds }
  );
  return response.data;
};

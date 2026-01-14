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
  const response = await apiClient.get<CurrentPrice[]>('/prices/current');
  return response.data;
};

/**
 * Fetch current price for a single item
 */
export const fetchCurrentPrice = async (itemId: number): Promise<CurrentPrice> => {
  const response = await apiClient.get<CurrentPrice>(`/prices/current/${itemId}`);
  return response.data;
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
  const response = await apiClient.get<PriceHistory>(`/prices/history/${itemId}`, {
    params: { period, sample },
  });
  return response.data;
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

/**
 * Tests for API client functions
 */

import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from './client';
import { fetchItemById, fetchItemCount, fetchItems } from './items';
import {
  fetchAllCurrentPrices,
  fetchBatchCurrentPrices,
  fetchCurrentPrice,
  fetchPriceHistory,
} from './prices';

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
    AxiosError: class AxiosError extends Error {
      response?: unknown;
      isAxiosError = true;
    },
  };
});

describe('API Client - Items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchItems', () => {
    it('should fetch items with default params', async () => {
      const mockData = {
        items: [{ item_id: 1, name: 'Test Item' }],
        total: 1,
        page: 1,
        page_size: 50,
        total_pages: 1,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockData });

      const result = await fetchItems();

      expect(apiClient.get).toHaveBeenCalledWith('/items', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('should fetch items with pagination params', async () => {
      const mockData = {
        items: [],
        total: 100,
        page: 2,
        page_size: 25,
        total_pages: 4,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockData });

      const params = { page: 2, pageSize: 25 };
      await fetchItems(params);

      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: { page: 2, limit: 25, sort_by: undefined, order: undefined, members: undefined }
      });
    });

    it('should fetch items with filters', async () => {
      const mockData = { items: [], total: 0, page: 1, page_size: 50, total_pages: 0 };
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockData });

      const params = { members: true };
      await fetchItems(params);

      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: { page: undefined, limit: undefined, sort_by: undefined, order: undefined, members: true }
      });
    });
  });

  describe('fetchItemById', () => {
    it('should fetch a single item by ID', async () => {
      const mockItem = {
        item_id: 1,
        name: 'Abyssal whip',
        icon_url: 'test.png',
        members: true,
        buy_limit: 70,
        high_alch: 72000,
        low_alch: 48000,
      };

      // Mock response with data wrapper
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: mockItem } });

      const result = await fetchItemById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/items/1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('fetchItemCount', () => {
    it('should fetch total items count', async () => {
      const mockCount = { total: 15423 };
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockCount });

      const result = await fetchItemCount();

      expect(apiClient.get).toHaveBeenCalledWith('/items/count', { params: undefined });
      expect(result).toEqual(mockCount);
    });
  });
});

describe('API Client - Prices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCurrentPrice', () => {
    it('should fetch current price for an item', async () => {
      const mockPrice = {
        item_id: 1,
        high: 2000000,
        low: 1900000,
        volume: 5000,
        timestamp: '2026-01-14T12:00:00Z',
      };

      // Mock response with data wrapper
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: mockPrice } });

      const result = await fetchCurrentPrice(1);

      expect(apiClient.get).toHaveBeenCalledWith('/prices/current/1');
      expect(result).toEqual(mockPrice);
    });
  });

  describe('fetchBatchCurrentPrices', () => {
    it('should fetch current prices for multiple items', async () => {
      const mockResponse = {
        data: [
          { item_id: 1, high: 2000000, low: 1900000 },
          { item_id: 2, high: 100000, low: 95000 },
        ],
        meta: { count: 2 },
      };

      // fetchBatchCurrentPrices uses GET with query params
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockResponse });

      const result = await fetchBatchCurrentPrices([1, 2]);

      expect(apiClient.get).toHaveBeenCalledWith('/prices/current/batch?ids=1,2');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty item IDs array', async () => {
      const mockResponse = { data: [], meta: { count: 0 } };
      // fetchBatchCurrentPrices uses GET with query params
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockResponse });

      const result = await fetchBatchCurrentPrices([]);

      expect(apiClient.get).toHaveBeenCalledWith('/prices/current/batch?ids=');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchAllCurrentPrices', () => {
    it('should fetch all current prices', async () => {
      const mockPrices = [
        { item_id: 1, high: 2000000, low: 1900000 },
        { item_id: 2, high: 100000, low: 95000 },
      ];

      // Mock response with data wrapper
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: mockPrices, meta: { count: 2 } } });

      const result = await fetchAllCurrentPrices();

      expect(apiClient.get).toHaveBeenCalledWith('/prices/current');
      expect(result).toEqual(mockPrices);
    });
  });

  describe('fetchPriceHistory', () => {
    it('should fetch price history with default period', async () => {
      const mockHistoryData = [
        {
          timestamp: '2026-01-14T00:00:00Z',
          avgHighPrice: 2000000,
          avgLowPrice: 1900000,
          highPriceVolume: 100,
          lowPriceVolume: 50
        },
      ];

      // Mock response with data and meta wrapper
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          data: mockHistoryData,
          meta: { item_id: 1, period: '7d', count: mockHistoryData.length }
        },
      });

      const result = await fetchPriceHistory(1);

      expect(apiClient.get).toHaveBeenCalledWith('/prices/history/1', {
        params: { period: '7d' },
      });
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should fetch price history with specific period', async () => {
      const mockHistoryData = [
        {
          timestamp: '2026-01-14T00:00:00Z',
          avgHighPrice: 2000000,
          avgLowPrice: 1900000,
          highPriceVolume: 100,
          lowPriceVolume: 50
        },
      ];

      // Mock response with data and meta wrapper
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          data: mockHistoryData,
          meta: { item_id: 1, period: '30d', count: mockHistoryData.length }
        },
      });

      const result = await fetchPriceHistory(1, '30d');

      expect(apiClient.get).toHaveBeenCalledWith('/prices/history/1', {
        params: { period: '30d' },
      });
      expect(result.data).toBeDefined();
    });

    it('should fetch price history with sample flag', async () => {
      const mockHistoryData = [
        {
          timestamp: '2026-01-14T00:00:00Z',
          avgHighPrice: 2000000,
          avgLowPrice: 1900000,
          highPriceVolume: 100,
          lowPriceVolume: 50
        },
      ];

      // Mock response with data and meta wrapper
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          data: mockHistoryData,
          meta: { item_id: 1, period: '1y', count: mockHistoryData.length, sampled: true }
        },
      });

      const result = await fetchPriceHistory(1, '1y', 150);

      expect(apiClient.get).toHaveBeenCalledWith('/prices/history/1', {
        params: { period: '1y', sample: 150 },
      });
      expect(result.data).toBeDefined();
    });
  });
});

describe('API Client - Error Handling', () => {
  it('should handle network errors', async () => {
    const networkError = new Error('Network Error');
    vi.spyOn(apiClient, 'get').mockRejectedValue(networkError);

    await expect(fetchItemById(1)).rejects.toThrow('Network Error');
  });

  it('should handle 404 errors', async () => {
    const error = new AxiosError('Not Found');
    error.response = {
      status: 404,
      data: { error: 'Item not found' },
      statusText: 'Not Found',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    vi.spyOn(apiClient, 'get').mockRejectedValue(error);

    await expect(fetchItemById(999)).rejects.toThrow();
  });

  it('should handle 500 errors', async () => {
    const error = new AxiosError('Server Error');
    error.response = {
      status: 500,
      data: { error: 'Internal server error' },
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    vi.spyOn(apiClient, 'get').mockRejectedValue(error);

    await expect(fetchAllCurrentPrices()).rejects.toThrow();
  });
});

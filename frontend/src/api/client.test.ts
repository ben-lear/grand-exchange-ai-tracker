/**
 * Tests for API client functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError } from 'axios';
import apiClient from './client';
import { fetchItems, fetchItemById, searchItems, fetchItemCount } from './items';
import {
  fetchCurrentPrice,
  fetchBatchCurrentPrices,
  fetchAllCurrentPrices,
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
      response?: any;
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

      const params = { page: 2, page_size: 25 };
      await fetchItems(params);
      
      expect(apiClient.get).toHaveBeenCalledWith('/items', { params });
    });

    it('should fetch items with filters', async () => {
      const mockData = { items: [], total: 0, page: 1, page_size: 50, total_pages: 0 };
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockData });

      const params = { members: true, category: 'weapons' };
      await fetchItems(params);
      
      expect(apiClient.get).toHaveBeenCalledWith('/items', { params });
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

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockItem });

      const result = await fetchItemById(1);
      
      expect(apiClient.get).toHaveBeenCalledWith('/items/1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('searchItems', () => {
    it('should search items by query', async () => {
      const mockItems = [
        { item_id: 1, name: 'Dragon sword' },
        { item_id: 2, name: 'Dragon scimitar' },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockItems });

      const result = await searchItems('dragon');
      
      expect(apiClient.get).toHaveBeenCalledWith('/items/search', { params: { q: 'dragon' } });
      expect(result).toEqual(mockItems);
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

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockPrice });

      const result = await fetchCurrentPrice(1);
      
      expect(apiClient.get).toHaveBeenCalledWith('/prices/current/1');
      expect(result).toEqual(mockPrice);
    });
  });

  describe('fetchBatchCurrentPrices', () => {
    it('should fetch current prices for multiple items', async () => {
      const mockResponse = {
        prices: [
          { item_id: 1, high: 2000000, low: 1900000 },
          { item_id: 2, high: 100000, low: 95000 },
        ],
        count: 2,
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue({ data: mockResponse });

      const result = await fetchBatchCurrentPrices([1, 2]);
      
      expect(apiClient.post).toHaveBeenCalledWith('/prices/batch', {
        itemIds: [1, 2],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty item IDs array', async () => {
      const mockResponse = { prices: [], count: 0 };
      vi.spyOn(apiClient, 'post').mockResolvedValue({ data: mockResponse });

      const result = await fetchBatchCurrentPrices([]);
      
      expect(apiClient.post).toHaveBeenCalledWith('/prices/batch', {
        itemIds: [],
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchAllCurrentPrices', () => {
    it('should fetch all current prices', async () => {
      const mockPrices = [
        { item_id: 1, high: 2000000, low: 1900000 },
        { item_id: 2, high: 100000, low: 95000 },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockPrices });

      const result = await fetchAllCurrentPrices();
      
      expect(apiClient.get).toHaveBeenCalledWith('/prices/current');
      expect(result).toEqual(mockPrices);
    });
  });

  describe('fetchPriceHistory', () => {
    it('should fetch price history with default period', async () => {
      const mockHistory = {
        item_id: 1,
        prices: [
          { timestamp: '2026-01-14T00:00:00Z', high: 2000000, low: 1900000 },
        ],
        period: '7d',
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockHistory });

      const result = await fetchPriceHistory(1);
      
      expect(apiClient.get).toHaveBeenCalledWith('/prices/history/1', {
        params: { period: '7d', sample: undefined },
      });
      expect(result).toEqual(mockHistory);
    });

    it('should fetch price history with specific period', async () => {
      const mockHistory = {
        item_id: 1,
        prices: [],
        period: '30d',
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockHistory });

      const result = await fetchPriceHistory(1, '30d');
      
      expect(apiClient.get).toHaveBeenCalledWith('/prices/history/1', {
        params: { period: '30d', sample: undefined },
      });
      expect(result).toEqual(mockHistory);
    });

    it('should fetch price history with sample flag', async () => {
      const mockHistory = {
        item_id: 1,
        prices: [],
        period: '1y',
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockHistory });

      const result = await fetchPriceHistory(1, '1y', true);
      
      expect(apiClient.get).toHaveBeenCalledWith('/prices/history/1', {
        params: { period: '1y', sample: true },
      });
      expect(result).toEqual(mockHistory);
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
      config: {} as any,
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
      config: {} as any,
    };
    
    vi.spyOn(apiClient, 'get').mockRejectedValue(error);

    await expect(fetchAllCurrentPrices()).rejects.toThrow();
  });
});

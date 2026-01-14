import axios from 'axios';
import type {
  Item,
  ItemDetail,
  PriceHistory,
  PaginatedResponse,
  APIResponse,
  PriceGraphData,
  TrendingItem,
  BiggestMover,
  StatsResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens or custom headers here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Handle unauthorized
    } else if (error.response?.status === 500) {
      // Handle server errors
    }
    return Promise.reject(error);
  }
);

// ===== Health & Readiness =====
export const healthAPI = {
  check: () => apiClient.get('/health'),
  ready: () => apiClient.get('/ready'),
};

// ===== Items API =====
export const itemsAPI = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    members?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) =>
    apiClient.get<APIResponse<PaginatedResponse<Item>>>('/v1/items', { params }),

  getById: (id: number) =>
    apiClient.get<APIResponse<ItemDetail>>(`/v1/items/${id}`),
};

// ===== Prices API =====
export const pricesAPI = {
  getHistory: (itemId: number, range?: '7d' | '30d' | '90d' | '180d') =>
    apiClient.get<APIResponse<PriceHistory[]>>(`/v1/items/${itemId}/prices`, {
      params: { range },
    }),

  getGraph: (itemId: number, range?: '7d' | '30d' | '90d' | '180d') =>
    apiClient.get<APIResponse<PriceGraphData>>(`/v1/items/${itemId}/graph`, {
      params: { range },
    }),

  getTrend: (itemId: number) =>
    apiClient.get<APIResponse<ItemDetail['price_trend']>>(`/v1/items/${itemId}/trend`),
};

// ===== Statistics API =====
export const statsAPI = {
  trending: (params?: { limit?: number; timeframe?: string }) =>
    apiClient.get<APIResponse<TrendingItem[]>>('/v1/stats/trending', { params }),

  biggestMovers: (params?: { direction?: 'gainers' | 'losers'; limit?: number }) =>
    apiClient.get<APIResponse<BiggestMover[]>>('/v1/stats/biggest-movers', { params }),

  summary: () =>
    apiClient.get<APIResponse<StatsResponse>>('/v1/stats/summary'),
};

/**
 * Central exports for all API functions
 */

// API client
export { default as apiClient, checkHealth, API_BASE_URL } from './client';

// Item API
export {
  fetchItems,
  fetchItemById,
  searchItems,
  fetchItemCount,
  fetchItemsByIds,
} from './items';

// Price API
export {
  fetchAllCurrentPrices,
  fetchCurrentPrice,
  fetchBatchCurrentPrices,
  fetchPriceHistory,
  syncCurrentPrices,
} from './prices';

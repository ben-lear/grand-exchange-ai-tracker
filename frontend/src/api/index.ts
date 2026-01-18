/**
 * Central exports for all API functions
 */

// API client
export { API_BASE_URL, default as apiClient, checkHealth } from './client';

// Item API
export {
  fetchItemById,
  fetchItemCount, fetchItems, fetchItemsByIds
} from './items';

// Price API
export {
  fetchAllCurrentPrices, fetchBatchCurrentPrices, fetchCurrentPrice, fetchPriceHistory,
  syncCurrentPrices
} from './prices';

// Watchlist API
export {
  createWatchlistShare,
  isValidShareToken,
  retrieveWatchlistShare
} from './watchlist';


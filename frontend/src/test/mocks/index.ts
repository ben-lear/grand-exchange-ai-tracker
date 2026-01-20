/**
 * Mock data exports for testing
 *
 * @example
 * import { mockItem, mockCurrentPrice, createMockItem } from '@/test/mocks';
 */

// Item mocks
export {
    createMockItem,
    createMockItems, mockItem, mockItemSummaries, mockItems
} from './mockItems';

// Price mocks
export {
    createMockCurrentPrice,
    createMockPriceHistory,
    createPriceMap, mockCurrentPrice,
    mockCurrentPrices,
    mockPriceHistory
} from './mockPrices';

// Store mocks
export {
    mockFavoritesStore,
    mockItemDataStore, mockPinnedStore, mockWatchlistStore, resetAllMockStores
} from './mockStores';


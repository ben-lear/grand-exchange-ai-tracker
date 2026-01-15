/**
 * Central exports for all custom hooks
 */

// Item hooks
export {
  useItems,
  useItem,
  useSearchItems,
  useItemCount,
  usePrefetchItem,
  itemKeys,
} from './useItems';

// Price hooks
export {
  useAllCurrentPrices,
  useCurrentPrice,
  useBatchCurrentPrices,
  usePriceHistory,
  useSyncCurrentPrices,
  usePrefetchPriceHistory,
  priceKeys,
} from './usePrices';

// SSE hooks
export {
  usePriceStream,
  type PriceUpdate,
  type UsePriceStreamOptions,
  type UsePriceStreamReturn,
} from './usePriceStream';

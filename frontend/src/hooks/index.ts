/**
 * Central exports for all custom hooks
 */

// Item hooks
export {
    itemKeys,
    useItem,
    useItemCount,
    useItemFiltering,
    useItemPrefetcher,
    useItems,
    usePrefetchItem
} from './items';
export type {
    PrefetcherState,
    UseItemFilteringParams,
    UseItemFilteringReturn
} from './items';

// Price hooks
export {
    priceKeys,
    useAllCurrentPrices,
    useBatchCurrentPrices,
    useChartData,
    useCurrentPrice,
    usePrefetchPriceHistory,
    usePriceHistory,
    usePriceStream,
    useSyncCurrentPrices
} from './prices';
export type {
    ChartDataPoint,
    ChartStats,
    PriceUpdate,
    UseChartDataParams,
    UseChartDataReturn,
    UsePriceStreamOptions,
    UsePriceStreamReturn
} from './prices';

// Search hooks
export {
    useRecentSearches,
    useSearchKeyboard
} from './search';
export type {
    RecentItem,
    UseSearchKeyboardParams,
    UseSearchKeyboardReturn
} from './search';

// Utility hooks
export {
    useDebouncedValue,
    useOnClickOutside
} from './utils';


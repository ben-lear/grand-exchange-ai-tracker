/**
 * Central exports for all utility functions
 */

// Formatters
export {
  formatGP,
  formatGold,
  formatNumber,
  formatPercentage,
  formatPriceChange,
  parseGP,
  abbreviateNumber,
  formatCompact,
  formatSpread,
  formatMarginPercent,
  calculateFlipProfit,
} from './formatters';

// Date utilities
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTimestamp,
  formatTime,
  formatISODate,
  formatShortDate,
  isRecent,
} from './dateUtils';

// Class name utilities
export { cn, createCN } from './cn';
export { default } from './cn';

// Helper utilities
export {
  calculateTrend,
  getTrendColor,
  getTrendBgColor,
  getTrendIcon,
  sortPrices,
  filterPrices,
  calculatePercentageChange,
  isValidItemId,
  debounce,
  throttle,
} from './helpers';

// Slug utilities
export {
  itemNameToSlug,
  slugToSearchTerm,
  getItemUrl,
} from './slug';

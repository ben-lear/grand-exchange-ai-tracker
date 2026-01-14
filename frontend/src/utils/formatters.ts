/**
 * Format a number as OSRS-style price (e.g., 5.2m, 1.5k, 125)
 */
export const formatPrice = (price: number): string => {
  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toFixed(1)}b`;
  }
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)}m`;
  }
  if (price >= 1_000) {
    return `${(price / 1_000).toFixed(1)}k`;
  }
  return price.toString();
};

/**
 * Format a number with commas (e.g., 1,234,567)
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return then.toLocaleDateString();
};

/**
 * Format a timestamp to readable date
 */
export const formatDate = (timestamp: number | string | Date): string => {
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp * 1000) 
    : new Date(timestamp);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a timestamp to readable date and time
 */
export const formatDateTime = (timestamp: number | string | Date): string => {
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp * 1000) 
    : new Date(timestamp);
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate percentage change
 */
export const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage with sign
 */
export const formatPercent = (percent: number): string => {
  const formatted = Math.abs(percent).toFixed(2);
  return percent > 0 ? `+${formatted}%` : percent < 0 ? `-${formatted}%` : `${formatted}%`;
};

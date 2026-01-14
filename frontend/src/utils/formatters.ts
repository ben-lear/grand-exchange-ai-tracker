/**
 * Number and currency formatting utilities
 */

/**
 * Format a GP value with appropriate suffix (K, M, B)
 * @param value - The GP value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with suffix
 * 
 * @example
 * formatGP(1234567) // "1.2M"
 * formatGP(123) // "123"
 * formatGP(1500, 0) // "2K"
 */
export const formatGP = (value: number, decimals: number = 1): string => {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`;
  }
  if (absValue >= 10_000) {
    return `${sign}${(absValue / 1_000).toFixed(decimals)}K`;
  }
  
  return `${sign}${absValue.toLocaleString()}`;
};

/**
 * Format a number with thousand separators
 * @param value - The number to format
 * @returns Formatted string with commas
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Format a percentage change with sign
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string with + or - sign
 * 
 * @example
 * formatPercentage(5.123) // "+5.12%"
 * formatPercentage(-2.5) // "-2.50%"
 * formatPercentage(0) // "0.00%"
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  if (value === 0) return `0.${'0'.repeat(decimals)}%`;
  
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Format a price change with sign and GP suffix
 * @param value - The price change value
 * @returns Formatted string with sign and suffix
 * 
 * @example
 * formatPriceChange(1234567) // "+1.2M"
 * formatPriceChange(-500) // "-500"
 */
export const formatPriceChange = (value: number): string => {
  if (value === 0) return '0';
  
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatGP(value)}`;
};

/**
 * Parse a formatted GP string back to number
 * @param value - The formatted GP string (e.g., "1.2M")
 * @returns Parsed number value
 * 
 * @example
 * parseGP("1.2M") // 1200000
 * parseGP("500K") // 500000
 */
export const parseGP = (value: string): number => {
  const match = value.match(/^([+-]?)(\d+(?:\.\d+)?)(K|M|B)?$/i);
  if (!match) return 0;
  
  const [, sign, num, suffix] = match;
  let result = parseFloat(num);
  
  if (suffix) {
    const multipliers: Record<string, number> = {
      K: 1_000,
      M: 1_000_000,
      B: 1_000_000_000,
    };
    result *= multipliers[suffix.toUpperCase()];
  }
  
  return sign === '-' ? -result : result;
};

/**
 * Abbreviate large numbers for display
 * @param value - The number to abbreviate
 * @returns Abbreviated string
 * 
 * @example
 * abbreviateNumber(1234567) // "1.23M"
 * abbreviateNumber(123) // "123"
 */
export const abbreviateNumber = (value: number): string => {
  return formatGP(value, 2);
};

/**
 * Format a number as a compact string (browser-native)
 * @param value - The number to format
 * @returns Formatted compact string
 * 
 * @example
 * formatCompact(1234567) // "1.2M"
 */
export const formatCompact = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * ChartTooltip - Custom tooltip for price charts
 * Shows detailed information about price points
 */

import { format } from 'date-fns';
import { formatGold, formatNumber } from '@/utils/formatters';
import type { PricePoint } from '@/types';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: PricePoint;
    dataKey: string;
    color: string;
  }>;
  label?: string | number;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length || !label) {
    return null;
  }

  const data = payload[0].payload;
  const timestamp = new Date(label);

  // Calculate change from previous point if available
  const priceChange = data.previousPrice 
    ? data.price - data.previousPrice 
    : null;
  
  const changePercent = data.previousPrice && data.previousPrice > 0
    ? ((data.price - data.previousPrice) / data.previousPrice) * 100
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px]">
      {/* Timestamp */}
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {format(timestamp, 'MMM d, yyyy HH:mm')}
      </div>

      {/* Price */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatGold(data.price)}
          </span>
        </div>

        {/* Volume if available */}
        {data.volume && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Volume:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatNumber(data.volume)}
            </span>
          </div>
        )}

        {/* Price change if available */}
        {priceChange !== null && changePercent !== null && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-1 mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Change:</span>
            <div className="text-right">
              <div
                className={`text-sm font-medium ${
                  priceChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}{formatGold(priceChange)}
              </div>
              <div
                className={`text-xs ${
                  changePercent >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
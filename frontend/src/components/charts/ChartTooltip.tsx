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

  // Use avgHighPrice, avgLowPrice, or fallback to price if available
  const displayPrice = data.price ?? data.avgHighPrice ?? data.avgLowPrice ?? 0;
  const displayVolume = data.volume ?? (data.highPriceVolume ?? 0) + (data.lowPriceVolume ?? 0);

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
            {formatGold(displayPrice)}
          </span>
        </div>

        {/* Volume if available */}
        {displayVolume > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Volume:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatNumber(displayVolume)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
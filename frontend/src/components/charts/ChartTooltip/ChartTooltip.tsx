/**
 * ChartTooltip - Custom tooltip for price charts
 * Shows detailed information about price points
 */

import type { PricePoint } from '@/types';
import { formatGold, formatNumber } from '@/utils/formatters';
import { format } from 'date-fns';
import React from 'react';
import { Stack, Text } from '@/components/ui';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: PricePoint;
    dataKey: string;
    color: string;
    coordinate?: { x: number; y: number };
  }>;
  label?: string | number;
  coordinate?: { x: number; y: number };
  viewBox?: { x: number; y: number; width: number; height: number };
}

export function ChartTooltip({ active, payload, label, coordinate, viewBox }: ChartTooltipProps) {
  if (!active || !payload || !payload.length || !label) {
    return null;
  }

  const data = payload[0].payload;
  const timestamp = new Date(label);

  // Get both high and low prices
  const highPrice = data.highPrice ?? data.avgHighPrice ?? 0;
  const lowPrice = data.lowPrice ?? data.avgLowPrice ?? 0;
  const highVolume = data.highPriceVolume ?? 0;
  const lowVolume = data.lowPriceVolume ?? 0;

  // Show both prices if available, otherwise fallback to single price
  const hasDualPrices = highPrice > 0 && lowPrice > 0;

  // Calculate fixed Y position centered between high and low points for this timestamp
  let customStyle: React.CSSProperties = {};

  if (hasDualPrices && payload.length >= 2) {
    // Find the Y coordinates for high and low prices from the payload
    const highEntry = payload.find(p => p.dataKey === 'highPrice');
    const lowEntry = payload.find(p => p.dataKey === 'lowPrice');

    if (highEntry?.coordinate && lowEntry?.coordinate && viewBox) {
      // Calculate absolute midpoint Y position between the two data points
      const midpointY = (highEntry.coordinate.y + lowEntry.coordinate.y) / 2;

      // Position absolutely within the chart, ignoring cursor Y position
      customStyle = {
        position: 'fixed',
        top: `${midpointY + viewBox.y}px`,
        left: coordinate?.x ? `${coordinate.x + viewBox.x + 10}px` : undefined,
        // transform: 'translateY(-50%)', // Center the box on the midpoint
        transition: 'top 0.15s ease-out, left 0.15s ease-out',
        pointerEvents: 'none',
      };
    }
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px]"
      style={customStyle}
    >
      {/* Timestamp */}
      <Text variant="heading" size="sm" className="mb-2">
        {format(timestamp, 'MMM d, yyyy HH:mm')}
      </Text>

      {/* Prices */}
      <div className="space-y-1">
        {hasDualPrices ? (
          <>
            {/* High Price */}
            <Stack direction="row" align="center" justify="between" gap={3}>
              <Stack direction="row" align="center" gap={2}>
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <Text variant="muted" size="sm">High:</Text>
              </Stack>
              <Text variant="heading" size="sm">
                {formatGold(highPrice)}
              </Text>
            </Stack>

            {/* Low Price */}
            <Stack direction="row" align="center" justify="between" gap={3}>
              <Stack direction="row" align="center" gap={2}>
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <Text variant="muted" size="sm">Low:</Text>
              </Stack>
              <Text variant="heading" size="sm">
                {formatGold(lowPrice)}
              </Text>
            </Stack>

            {/* Spread */}
            <Stack direction="row" align="center" justify="between" gap={3} className="pt-1 border-t border-gray-200 dark:border-gray-600">
              <Text variant="muted" size="xs">Spread:</Text>
              <Text size="xs" weight="medium" className="text-gray-700 dark:text-gray-300">
                {formatGold(highPrice - lowPrice)}
              </Text>
            </Stack>
          </>
        ) : (
          /* Fallback to single price */
          <Stack direction="row" align="center" justify="between">
            <Text variant="muted" size="sm">Price:</Text>
            <Text variant="heading" size="sm">
              {formatGold(data.price ?? 0)}
            </Text>
          </Stack>
        )}

        {/* Volume if available */}
        {(highVolume > 0 || lowVolume > 0) && (
          <Stack direction="row" align="center" justify="between" className="pt-1 border-t border-gray-200 dark:border-gray-600">
            <Text variant="muted" size="xs">Volume:</Text>
            <Text size="xs" weight="medium" className="text-gray-700 dark:text-gray-300">
              {formatNumber(highVolume + lowVolume)}
            </Text>
          </Stack>
        )}
      </div>
    </div>
  );
}
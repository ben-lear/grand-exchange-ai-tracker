/**
 * PriceChart - Interactive price chart for OSRS items
 * Features:
 * - Time-series line chart with Recharts
 * - Responsive design
 * - Custom tooltip
 * - Gradient fill
 * - Price trend indicators
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ChartTooltip } from './ChartTooltip';
import { LoadingSpinner, ErrorDisplay } from '@/components/common';
import { formatGold } from '@/utils/formatters';
import type { PricePoint, TimePeriod } from '@/types';

export interface PriceChartProps {
  data: PricePoint[];
  isLoading?: boolean;
  error?: Error | null;
  period: TimePeriod;
  itemName?: string;
  height?: number;
  showVolume?: boolean;
}

export function PriceChart({
  data,
  isLoading = false,
  error = null,
  period,
  itemName,
  height = 400,
  showVolume = false,
}: PriceChartProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((point, index) => ({
        ...point,
        timestamp: new Date(point.timestamp).getTime(),
        previousPrice: index > 0 ? data[index - 1].price : null,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  // Calculate price statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const prices = chartData.map(d => d.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return {
      firstPrice,
      lastPrice,
      minPrice,
      maxPrice,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    };
  }, [chartData]);

  // Format X-axis ticks based on period
  const formatXAxisTick = (timestamp: number) => {
    const date = new Date(timestamp);
    
    switch (period) {
      case '24h':
        return format(date, 'HH:mm');
      case '7d':
      case '30d':
        return format(date, 'MMM d');
      case '90d':
      case '1y':
        return format(date, 'MMM d');
      case 'all':
        return format(date, 'MMM yyyy');
      default:
        return format(date, 'MMM d');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <LoadingSpinner size="lg" message="Loading chart..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4" style={{ height }}>
        <ErrorDisplay
          title="Failed to load chart data"
          error={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Empty state
  if (chartData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          No price data available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try selecting a different time period
        </p>
      </div>
    );
  }

  const lineColor = stats?.trend === 'up' ? '#10b981' : stats?.trend === 'down' ? '#ef4444' : '#6b7280';
  
  return (
    <div className="space-y-4">
      {/* Chart Header with Stats */}
      {stats && (
        <div className="flex items-center justify-between">
          <div>
            {itemName && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {itemName} Price Chart
              </h3>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Current: {formatGold(stats.lastPrice)}</span>
              <span>High: {formatGold(stats.maxPrice)}</span>
              <span>Low: {formatGold(stats.minPrice)}</span>
            </div>
          </div>
          
          {/* Price Change */}
          <div className="text-right">
            <div
              className={`flex items-center gap-1 text-lg font-semibold ${
                stats.trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : stats.trend === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {stats.trend === 'up' && <TrendingUp className="w-5 h-5" />}
              {stats.trend === 'down' && <TrendingDown className="w-5 h-5" />}
              {stats.trend === 'flat' && <Minus className="w-5 h-5" />}
              
              <span>
                {stats.change >= 0 ? '+' : ''}{formatGold(stats.change)}
              </span>
            </div>
            <div
              className={`text-sm ${
                stats.changePercent >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              ({stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {/* Grid */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            
            {/* Axes */}
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxisTick}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => formatGold(value, { short: true })}
              stroke="#6b7280"
              fontSize={12}
            />
            
            {/* Tooltip */}
            <Tooltip content={<ChartTooltip />} />
            
            {/* Current price reference line */}
            {stats && (
              <ReferenceLine 
                y={stats.lastPrice} 
                stroke={lineColor}
                strokeDasharray="5 5"
                opacity={0.5}
              />
            )}
            
            {/* Price line */}
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: lineColor,
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
            
            {/* Volume line if enabled */}
            {showVolume && (
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#9ca3af"
                strokeWidth={1}
                dot={false}
                yAxisId="volume"
                opacity={0.6}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
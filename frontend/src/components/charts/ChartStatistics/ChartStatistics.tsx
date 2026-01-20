/**
 * ChartStatistics - Display price statistics for chart
 * 
 * Features:
 * - Current/High/Low prices with labels
 * - Trend indicators (up/down arrows)
 * - Color-coded percentage change
 * - Responsive 4-column grid
 */

import type { ChartStats } from '@/hooks';
import { formatGold } from '@/utils/formatters';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

export interface ChartStatisticsProps {
    stats: ChartStats;
    itemName?: string;
}

export function ChartStatistics({ stats, itemName }: ChartStatisticsProps) {
    return (
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
                    className={`flex items-center gap-1 text-lg font-semibold ${stats.trend === 'up'
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
                        {stats.change >= 0 ? '+' : ''}
                        {formatGold(stats.change)}
                    </span>
                </div>
                <div
                    className={`text-sm ${stats.changePercent >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                >
                    ({stats.changePercent >= 0 ? '+' : ''}
                    {stats.changePercent.toFixed(2)}%)
                </div>
            </div>
        </div>
    );
}

/**
 * CurrentPriceCard - Displays current price information for an item
 * Shows buy price (high), sell price (low), mid price, and flip margin
 */

import type { CurrentPrice } from '@/types';
import { formatGold, formatMarginPercent, formatRelativeTime, formatSpread } from '@/utils';
import { TrendingUp } from 'lucide-react';
import React from 'react';

export interface CurrentPriceCardProps {
    /** The current price data to display */
    price: CurrentPrice;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * CurrentPriceCard component
 * Displays a 4-column grid with buy price, sell price, mid price, and flip margin
 */
export const CurrentPriceCard: React.FC<CurrentPriceCardProps> = ({ price, className = '' }) => {
    // Calculate mid price
    const midPrice = price.highPrice && price.lowPrice
        ? Math.round((price.highPrice + price.lowPrice) / 2)
        : price.highPrice
            ? price.highPrice
            : price.lowPrice
                ? price.lowPrice
                : null;

    return (
        <div className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Current Prices
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Updated: {formatRelativeTime(price.updatedAt)}
                    </p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Buy Price (High) */}
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Buy Price (High)</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {price.highPrice ? formatGold(price.highPrice) : '—'}
                    </div>
                    {price.highPriceTime && (
                        <div className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(price.highPriceTime)}
                        </div>
                    )}
                </div>

                {/* Sell Price (Low) */}
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sell Price (Low)</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {price.lowPrice ? formatGold(price.lowPrice) : '—'}
                    </div>
                    {price.lowPriceTime && (
                        <div className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(price.lowPriceTime)}
                        </div>
                    )}
                </div>

                {/* Mid Price */}
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mid Price</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {midPrice ? formatGold(midPrice) : '—'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Average of buy/sell
                    </div>
                </div>

                {/* Flip Margin */}
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Flip Margin</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatSpread(price.highPrice, price.lowPrice)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatMarginPercent(price.highPrice, price.lowPrice)} profit
                    </div>
                </div>
            </div>
        </div>
    );
};

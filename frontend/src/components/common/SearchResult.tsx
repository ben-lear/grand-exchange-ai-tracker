/**
 * SearchResult component - Individual search result item
 */

import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
import type { CurrentPrice, Item } from '../../types';
import { cn } from '../../utils';

/**
 * Item with optional price data for search results
 */
export interface ItemWithPrice extends Item {
    currentPrice?: CurrentPrice & {
        change24h?: number;
    };
}

export interface SearchResultProps {
    item: Item | ItemWithPrice;
    isSelected?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
}

/**
 * Individual search result item with item icon, name, and price
 */
export const SearchResult: React.FC<SearchResultProps> = ({
    item,
    isSelected = false,
    onClick,
    onMouseEnter,
}) => {
    // Format price for display
    const formatPrice = (price: number): string => {
        if (price >= 1_000_000) {
            return `${(price / 1_000_000).toFixed(1)}M`;
        }
        if (price >= 1_000) {
            return `${(price / 1_000).toFixed(1)}K`;
        }
        return price.toLocaleString();
    };

    // Note: currentPrice may be present on ItemWithPrice but not base Item
    const itemWithPrice = item as ItemWithPrice;
    const currentPrice = itemWithPrice.currentPrice?.highPrice || 0;
    const priceChange = itemWithPrice.currentPrice?.change24h;

    return (
        <button
            role="option"
            aria-selected={isSelected}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                isSelected && 'bg-gray-100 dark:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
            )}
        >
            {/* Item Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                {item.iconUrl ? (
                    <img
                        src={item.iconUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
                        ?
                    </div>
                )}
            </div>

            {/* Item Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                    </p>
                    {item.members && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                            M
                        </span>
                    )}
                </div>
                {item.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Price Info */}
            <div className="flex-shrink-0 text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPrice(currentPrice)} gp
                </p>
                {priceChange !== undefined && priceChange !== 0 && (
                    <div
                        className={cn(
                            'flex items-center gap-1 text-xs',
                            priceChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}
                    >
                        {priceChange > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%</span>
                    </div>
                )}
            </div>
        </button>
    );
};

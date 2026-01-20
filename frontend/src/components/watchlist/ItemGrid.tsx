/**
 * ItemGrid - Grid display of items with icons and names
 * Used in SharedWatchlistPage to display watchlist items
 */

import { ItemDisplay } from '@/components/item';
import { EmptyState } from '@/components/ui';
import type { WatchlistItem } from '@/types/watchlist';
import { ListPlus } from 'lucide-react';
import React from 'react';

export interface ItemGridProps {
    /** Array of items to display */
    items: WatchlistItem[];
    /** Title for the grid section */
    title?: string;
    /** Whether to show links to item pages */
    showLinks?: boolean;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * ItemGrid component
 * Displays items in a responsive grid layout with empty state
 */
export const ItemGrid: React.FC<ItemGridProps> = ({
    items,
    title,
    showLinks = false,
    className = '',
}) => {
    if (items.length === 0) {
        return (
            <EmptyState
                icon={ListPlus}
                title="Empty Watchlist"
                description="This watchlist doesn't contain any items yet."
                className={className}
            />
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
            {title && (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {title} ({items.length})
                </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((item) => {
                    const safeTimestamp = Number.isFinite(item.addedAt) ? item.addedAt : 0;

                    return (
                        <div
                            key={item.itemId}
                            className="flex flex-col items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                            <ItemDisplay
                                item={{
                                    id: item.itemId,
                                    itemId: item.itemId,
                                    name: item.name,
                                    iconUrl: item.iconUrl || '',
                                    description: '',
                                    members: false,
                                    buyLimit: 0,
                                    highAlch: 0,
                                    lowAlch: 0,
                                    createdAt: new Date(safeTimestamp).toISOString(),
                                    updatedAt: new Date(safeTimestamp).toISOString(),
                                }}
                                size="xs"
                                showId={true}
                                showLink={showLinks}
                                className="w-full"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
/**
 * Watchlist Cell Component
 * Renders watchlist dropdown and displays watchlist names
 */

import { WatchlistDropdown } from '@/components/common/WatchlistDropdown';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import type { Item } from '@/types';
import { ListPlus } from 'lucide-react';

interface WatchlistCellProps {
    item: Item;
}

export function WatchlistCell({ item }: WatchlistCellProps) {
    const { getItemWatchlists } = useWatchlistStore();
    const itemWatchlists = getItemWatchlists(item.itemId);

    // Filter out default Favorites watchlist to only show custom watchlists
    const customWatchlists = itemWatchlists.filter((w) => !w.isDefault);

    // Build watchlist names string
    let watchlistNamesText = '';
    let watchlistNamesTooltip = '';

    if (customWatchlists.length > 0) {
        const allNames = customWatchlists.map((w) => w.name);
        watchlistNamesTooltip = allNames.join(', ');

        if (customWatchlists.length <= 2) {
            watchlistNamesText = allNames.join(', ');
        } else {
            watchlistNamesText = `${allNames.slice(0, 2).join(', ')}, +${customWatchlists.length - 2
                } more`;
        }
    }

    return (
        <div className="flex items-center gap-2">
            <WatchlistDropdown
                itemId={item.itemId}
                itemName={item.name}
                itemIconUrl={item.iconUrl || ''}
                buttonClassName="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                buttonContent={<ListPlus className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
            />
            {watchlistNamesText && (
                <span
                    className="text-xs text-gray-500 dark:text-gray-400 truncate"
                    title={watchlistNamesTooltip}
                >
                    {watchlistNamesText}
                </span>
            )}
        </div>
    );
}

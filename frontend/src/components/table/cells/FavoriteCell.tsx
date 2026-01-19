/**
 * Favorite Cell Component
 * Renders a favorite toggle button for table rows
 */

import { useWatchlistStore } from '@/stores/useWatchlistStore';
import type { Item } from '@/types';
import { DEFAULT_WATCHLIST_ID } from '@/types/watchlist';
import { Star } from 'lucide-react';

interface FavoriteCellProps {
    item: Item;
}

export function FavoriteCell({ item }: FavoriteCellProps) {
    const { isItemInWatchlist, addItemToWatchlist, removeItemFromWatchlist } = useWatchlistStore();
    const isFavorited = isItemInWatchlist(DEFAULT_WATCHLIST_ID, item.itemId);

    const handleToggleFavorite = () => {
        if (isFavorited) {
            removeItemFromWatchlist(DEFAULT_WATCHLIST_ID, item.itemId);
        } else {
            addItemToWatchlist(DEFAULT_WATCHLIST_ID, {
                itemId: item.itemId,
                name: item.name,
                iconUrl: item.iconUrl || '',
            });
        }
    };

    return (
        <button
            onClick={handleToggleFavorite}
            className="rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors block mx-auto"
            title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
            aria-label={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
        >
            <Star
                className={`w-4 h-4 ${isFavorited
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
            />
        </button>
    );
}

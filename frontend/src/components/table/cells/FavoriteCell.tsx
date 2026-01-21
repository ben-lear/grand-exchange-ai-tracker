/**
 * Favorite Cell Component
 * Renders a favorite toggle button for table rows
 */

import { ToggleButton } from '@/components/ui';
import { useWatchlistStore } from '@/stores';
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
        <ToggleButton
            icon={Star}
            isActive={isFavorited}
            onToggle={handleToggleFavorite}
            activeColor="yellow"
            size="sm"
            label={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
            tooltip={isFavorited ? 'Unfavorite' : 'Favorite'}
        />
    );
}

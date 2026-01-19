/**
 * Column definitions for the Items data table
 * Uses TanStack Table v8 column definitions
 */

import { usePinnedItemsStore } from '@/stores/usePinnedItemsStore';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import type { CurrentPrice, Item } from '@/types';
import { DEFAULT_WATCHLIST_ID } from '@/types/watchlist';
import { formatGold, formatNumber, getItemUrl } from '@/utils';
import { createColumnHelper } from '@tanstack/react-table';
import { ListPlus, Pin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WatchlistDropdown } from '../common/WatchlistDropdown';
import { Badge } from '../ui';

export interface ItemWithPrice extends Item {
  currentPrice?: CurrentPrice;
}

const columnHelper = createColumnHelper<ItemWithPrice>();

export const columns = [
  // Pin column
  columnHelper.display({
    id: 'pin',
    header: '',
    meta: {
      cellClassName: 'px-2',
    },
    cell: (info) => {
      const item = info.row.original;
      const { togglePin, isPinned } = usePinnedItemsStore();
      const pinned = isPinned(item.itemId);

      return (
        <button
          onClick={() => togglePin(item.itemId)}
          className="rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors block mx-auto"
          title={pinned ? 'Unpin item' : 'Pin item to top'}
        >
          <Pin
            className={`w-4 h-4 ${pinned
              ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500'
              }`}
          />
        </button>
      );
    },
    enableSorting: false,
    size: 20,
  }),

  // Favorite column
  columnHelper.display({
    id: 'favorite',
    header: '',
    meta: {
      cellClassName: 'px-2',
    },
    cell: (info) => {
      const item = info.row.original;
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
        >
          <Star
            className={`w-4 h-4 ${isFavorited
              ? 'fill-yellow-500 text-yellow-500'
              : 'text-gray-400 dark:text-gray-500'
              }`}
          />
        </button>
      );
    },
    enableSorting: false,
    size: 20,
  }),

  // Watchlist column
  columnHelper.display({
    id: 'watchlist',
    header: 'Watchlist',
    cell: (info) => {
      const item = info.row.original;
      const { getItemWatchlists } = useWatchlistStore();
      const itemWatchlists = getItemWatchlists(item.itemId);

      // Filter out default Favorites watchlist to only show custom watchlists
      const customWatchlists = itemWatchlists.filter(w => !w.isDefault);

      // Build watchlist names string
      let watchlistNamesText = '';
      let watchlistNamesTooltip = '';

      if (customWatchlists.length > 0) {
        const allNames = customWatchlists.map(w => w.name);
        watchlistNamesTooltip = allNames.join(', ');

        if (customWatchlists.length <= 2) {
          watchlistNamesText = allNames.join(', ');
        } else {
          watchlistNamesText = `${allNames.slice(0, 2).join(', ')}, +${customWatchlists.length - 2} more`;
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
    },
    enableSorting: false,
    size: 200,
  }),

  // Icon and Name column
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Item',
    cell: (info) => {
      const item = info.row.original;
      const itemUrl = getItemUrl(item.itemId, item.name);
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          {item.iconUrl && (
            <img
              src={item.iconUrl}
              alt={item.name}
              className="w-8 h-8 flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex items-center gap-2">
            <Link
              to={itemUrl}
              className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {item.name}
            </Link>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              #{item.itemId}
            </span>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableResizing: true,
    size: 250,
  }),

  // High Price column
  columnHelper.accessor((row) => row.currentPrice?.highPrice, {
    id: 'highPrice',
    header: 'High Price',
    cell: (info) => {
      const value = info.getValue();
      return value ? (
        <span className="font-mono text-green-600 dark:text-green-400">
          {formatNumber(value)}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
    enableSorting: true,
    size: 120,
  }),

  // Low Price column
  columnHelper.accessor((row) => row.currentPrice?.lowPrice, {
    id: 'lowPrice',
    header: 'Low Price',
    cell: (info) => {
      const value = info.getValue();
      return value ? (
        <span className="font-mono text-orange-600 dark:text-orange-400">
          {formatNumber(value)}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
    enableSorting: true,
    size: 120,
  }),

  // Average Price column
  columnHelper.accessor(
    (row) => {
      const high = row.currentPrice?.highPrice;
      const low = row.currentPrice?.lowPrice;
      if (high && low) {
        return Math.round((high + low) / 2);
      }
      return high || low || 0;
    },
    {
      id: 'avgPrice',
      header: 'Avg Price',
      cell: (info) => {
        const value = info.getValue();
        return value ? (
          <span className="font-mono text-blue-600 dark:text-blue-400">
            {formatGold(value)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
      enableSorting: true,
      size: 120,
    }
  ),

  // Members column
  columnHelper.accessor('members', {
    id: 'members',
    header: 'Members',
    cell: (info) => {
      const value = info.getValue();
      return (
        <div className="flex items-center justify-center">
          {value ? (
            <Badge variant="warning">P2P</Badge>
          ) : (
            <Badge variant="default">F2P</Badge>
          )}
        </div>
      );
    },
    enableSorting: true,
    size: 90,
  }),

  // Buy Limit column
  columnHelper.accessor('buyLimit', {
    id: 'buyLimit',
    header: 'Buy Limit',
    cell: (info) => {
      const value = info.getValue();
      return value ? (
        <span className="font-mono text-gray-700 dark:text-gray-300">
          {formatNumber(value)}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
    enableSorting: true,
    size: 100,
  }),

  // High Alch column
  columnHelper.accessor('highAlch', {
    id: 'highAlch',
    header: 'High Alch',
    cell: (info) => {
      const value = info.getValue();
      return value ? (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {formatGold(value)}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
    enableSorting: true,
    size: 100,
  }),
];


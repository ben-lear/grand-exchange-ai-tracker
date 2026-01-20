/**
 * Column definitions for the Items data table
 * Uses TanStack Table v8 column definitions
 */

import type { CurrentPrice, Item } from '@/types';
import { formatGold, formatNumber } from '@/utils';
import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui';
import { FavoriteCell, ItemNameCell, PinCell, PriceCell, WatchlistCell } from './cells';

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
    cell: (info) => <PinCell itemId={info.row.original.itemId} />,
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
    cell: (info) => <FavoriteCell item={info.row.original} />,
    enableSorting: false,
    size: 20,
  }),

  // Watchlist column
  columnHelper.display({
    id: 'watchlist',
    header: 'Watchlist',
    cell: (info) => <WatchlistCell item={info.row.original} />,
    enableSorting: false,
    size: 200,
  }),

  // Icon and Name column
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Item',
    cell: (info) => <ItemNameCell item={info.row.original} />,
    enableSorting: true,
    enableResizing: true,
    size: 250,
  }),

  // High Price column
  columnHelper.accessor((row) => row.currentPrice?.highPrice, {
    id: 'highPrice',
    header: 'High Price',
    cell: (info) => <PriceCell value={info.getValue()} type="high" />,
    enableSorting: true,
    size: 120,
  }),

  // Low Price column
  columnHelper.accessor((row) => row.currentPrice?.lowPrice, {
    id: 'lowPrice',
    header: 'Low Price',
    cell: (info) => <PriceCell value={info.getValue()} type="low" />,
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
      cell: (info) => <PriceCell value={info.getValue()} type="mid" />,
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


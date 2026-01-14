/**
 * Column definitions for the Items data table
 * Uses TanStack Table v8 column definitions
 */

import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { formatGold, formatNumber } from '@/utils/formatters';
import type { Item, CurrentPrice } from '@/types';

export interface ItemWithPrice extends Item {
  currentPrice?: CurrentPrice;
}

const columnHelper = createColumnHelper<ItemWithPrice>();

export const columns = [
  // Icon and Name column
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Item',
    cell: (info) => {
      const item = info.row.original;
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
          <div className="flex flex-col">
            <Link
              to={`/item/${item.itemId}`}
              className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {item.name}
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ID: {item.itemId}
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
          {formatGold(value)}
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
          {formatGold(value)}
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

  // Volume column
  columnHelper.accessor((row) => row.currentPrice?.volume, {
    id: 'volume',
    header: 'Volume',
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

  // Members column
  columnHelper.accessor('members', {
    id: 'members',
    header: 'Members',
    cell: (info) => {
      const value = info.getValue();
      return (
        <div className="flex items-center justify-center">
          {value ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              P2P
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              F2P
            </span>
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

/**
 * Default column visibility configuration
 */
export const defaultColumnVisibility = {
  name: true,
  highPrice: true,
  lowPrice: true,
  avgPrice: true,
  highVolume: false,
  lowVolume: false,
  members: true,
  buyLimit: false,
  highAlch: false,
};

/**
 * Export column IDs for reference
 */
export const COLUMN_IDS = {
  NAME: 'name',
  HIGH_PRICE: 'highPrice',
  LOW_PRICE: 'lowPrice',
  AVG_PRICE: 'avgPrice',
  HIGH_VOLUME: 'highVolume',
  LOW_VOLUME: 'lowVolume',
  MEMBERS: 'members',
  BUY_LIMIT: 'buyLimit',
  HIGH_ALCH: 'highAlch',
} as const;

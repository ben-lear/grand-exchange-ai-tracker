/**
 * TableToolbar - Search bar and table controls
 * Features:
 * - Search input with clear button
 * - Column visibility toggle
 * - Refresh button
 * - View density selector
 */

import { Download, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { SearchInput } from '../common/SearchInput';
import { ColumnToggle } from './ColumnToggle';

export interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onFilterClick?: () => void;
  isRefreshing?: boolean;
  totalCount?: number;
  visibleCount?: number;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  onRefresh,
  onExport,
  onFilterClick,
  isRefreshing = false,
  totalCount = 0,
  visibleCount = 0,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left side - Search */}
      <div className="flex-1 w-full sm:max-w-md">
        <SearchInput
          id="table-search"
          name="search"
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Filter items..."
          inputClassName="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Item count */}
        {totalCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mr-2">
            {visibleCount !== totalCount ? (
              <>
                <span className="font-semibold">{visibleCount.toLocaleString()}</span>
                {' of '}
                <span className="font-semibold">{totalCount.toLocaleString()}</span>
              </>
            ) : (
              <span className="font-semibold">{totalCount.toLocaleString()}</span>
            )}
            {' items'}
          </div>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Column toggle */}
        <ColumnToggle />

        {/* Filter button */}
        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
            title="Filter items"
            aria-label="Filter items"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        )}

        {/* Export button */}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
            title="Export data"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>
    </div>
  );
}

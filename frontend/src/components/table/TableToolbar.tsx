/**
 * TableToolbar - Search bar and table controls
 * Features:
 * - Search input with clear button
 * - Column visibility toggle
 * - Refresh button
 * - View density selector
 */

import { Download, ListCheck, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { SearchInput } from '../common/SearchInput';
import { Button } from '../ui';
import { ColumnToggle } from './ColumnToggle';

export interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onFilterClick?: () => void;
  onManageWatchlists?: () => void;
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
  onManageWatchlists,
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
          <Button
            variant="toolbar"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}

        {/* Column toggle */}
        <ColumnToggle />

        {/* Manage Watchlists button */}
        {onManageWatchlists && (
          <Button
            variant="secondary"
            size="default"
            onClick={onManageWatchlists}
            title="Manage watchlists"
            aria-label="Manage watchlists"
            leftIcon={<ListCheck className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Watchlists</span>
          </Button>
        )}

        {/* Filter button */}
        {onFilterClick && (
          <Button
            variant="secondary"
            size="default"
            onClick={onFilterClick}
            title="Filter items"
            aria-label="Filter items"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Filters</span>
          </Button>
        )}

        {/* Export button */}
        {onExport && (
          <Button
            variant="secondary"
            size="default"
            onClick={onExport}
            title="Export data"
            leftIcon={<Download className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </div>
    </div>
  );
}

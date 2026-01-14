/**
 * TableToolbar - Search bar and table controls
 * Features:
 * - Search input with debounce
 * - Column visibility toggle
 * - Refresh button
 * - View density selector
 */

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Columns, Download } from 'lucide-react';

export interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onColumnsToggle?: () => void;
  isRefreshing?: boolean;
  totalCount?: number;
  visibleCount?: number;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  onRefresh,
  onExport,
  onColumnsToggle,
  isRefreshing = false,
  totalCount = 0,
  visibleCount = 0,
}: TableToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left side - Search */}
      <div className="flex-1 w-full sm:max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search items..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
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

        {/* Column visibility toggle */}
        {onColumnsToggle && (
          <button
            onClick={onColumnsToggle}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle columns"
          >
            <Columns className="w-5 h-5" />
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

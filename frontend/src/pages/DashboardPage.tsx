/**
 * Dashboard page - Main page with items table
 * 
 * Uses client-side pagination and filtering with data from itemDataStore.
 * Items are prefetched on app mount; prices are synced from MainLayout.
 */

import { LoadingSpinner } from '@/components/common';
import {
  ExportButton,
  FilterPanel,
  ItemsTable,
  TablePagination,
  TableToolbar,
  type FilterState,
  type ItemWithPrice,
} from '@/components/table';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useItemDataStore } from '@/stores/itemDataStore';
import { createItemSearchIndex, filterItemIdsByRelevance } from '@/utils/itemSearch';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard page component
 * Displays the main items table with prices and filtering
 * All data comes from itemDataStore (prefetched on app mount)
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ members: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Debounce search query for filtering
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);

  // Get data from stores - items are prefetched in MainLayout
  // Subscribe to items and currentPrices Maps directly to get re-renders when they change
  const items = useItemDataStore((state) => state.items);
  const currentPrices = useItemDataStore((state) => state.currentPrices);
  const pricesLoaded = useItemDataStore((state) => state.pricesLoaded);
  const isFullyLoaded = useItemDataStore((state) => state.isFullyLoaded);

  const allItems = useMemo(() => Array.from(items.values()), [items]);
  const hasItems = items.size > 0;
  const isDataReady = hasItems && pricesLoaded;

  // Build fuse.js search index when items change
  const fuseIndex = useMemo(() => {
    if (allItems.length === 0) return null;
    return createItemSearchIndex(allItems);
  }, [allItems]);

  // Get matching item IDs from search query (sorted by relevance)
  // Supports both name search (fuzzy matching) and ID search (exact match)
  const searchMatchIds = useMemo(() => {
    if (!fuseIndex || !debouncedSearchQuery.trim()) return null;
    return filterItemIdsByRelevance(fuseIndex, debouncedSearchQuery);
  }, [fuseIndex, debouncedSearchQuery]);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    let results = allItems;

    // Apply non-search filters first
    results = results.filter(item => {
      // Members filter
      if (filters.members === 'members' && !item.members) return false;
      if (filters.members === 'f2p' && item.members) return false;

      // Price filters
      const price = currentPrices.get(item.itemId);
      const highPrice = price?.highPrice;
      if (filters.priceMin && (!highPrice || highPrice < filters.priceMin)) return false;
      if (filters.priceMax && (!highPrice || highPrice > filters.priceMax)) return false;

      return true;
    });

    // Apply search filter with relevance ordering
    if (searchMatchIds !== null && searchMatchIds.length > 0) {
      // Create a map for O(1) lookup and preserve relevance order
      const idToIndex = new Map(searchMatchIds.map((id, index) => [id, index]));

      // Filter and sort by relevance
      results = results
        .filter(item => idToIndex.has(item.itemId))
        .sort((a, b) => {
          const indexA = idToIndex.get(a.itemId) ?? Infinity;
          const indexB = idToIndex.get(b.itemId) ?? Infinity;
          return indexA - indexB;
        });
    }

    return results;
  }, [allItems, searchMatchIds, filters, currentPrices]);

  // Map filtered items to ItemWithPrice for the table
  const itemsWithPrices: ItemWithPrice[] = useMemo(() => {
    return filteredItems.map(item => ({
      ...item,
      currentPrice: currentPrices.get(item.itemId),
    }));
  }, [filteredItems, currentPrices]);

  // Client-side pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return itemsWithPrices.slice(startIndex, startIndex + pageSize);
  }, [itemsWithPrices, currentPage, pageSize]);

  const totalItems = itemsWithPrices.length;

  const handleRefresh = () => {
    // No-op for now since data auto-refreshes via price sync
    // Could add a manual refetch trigger if needed
  };

  const handleRowClick = (item: ItemWithPrice) => {
    navigate(`/items/${item.itemId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleManageWatchlists = () => {
    navigate('/watchlists');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  // Show loading spinner until both items and prices are loaded
  if (!isDataReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          {!hasItems ? 'Loading items...' : 'Loading prices...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Grand Exchange Items
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse and track all OSRS Grand Exchange items and their current prices
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar - Filter Panel */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Table Toolbar */}
            <TableToolbar
              searchValue={searchQuery}
              onSearchChange={handleSearchChange}
              onRefresh={handleRefresh}
              onFilterClick={() => setShowFilters(!showFilters)}
              onManageWatchlists={handleManageWatchlists}
              isRefreshing={!isFullyLoaded}
              totalCount={allItems.length}
              visibleCount={totalItems}
            />

            {/* Items Table */}
            <ItemsTable
              data={paginatedItems}
              isLoading={!hasItems}
              error={null}
              onRowClick={handleRowClick}
              enableVirtualization={paginatedItems.length > 200}
            />

            {/* Pagination */}
            {totalItems > 0 && (
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>

          {/* Export Button */}
          {itemsWithPrices.length > 0 && (
            <div className="mt-4 flex justify-end">
              <ExportButton
                data={itemsWithPrices}
                filename="osrs-ge-items"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

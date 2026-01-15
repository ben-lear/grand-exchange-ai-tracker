/**
 * Dashboard page - Main page with items table
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ItemsTable,
  TableToolbar,
  FilterPanel,
  TablePagination,
  ExportButton,
  type ItemWithPrice,
  type FilterState,
} from '@/components/table';
import { useItems, useAllCurrentPrices } from '@/hooks';
import type { PaginationParams, SortParams, ItemFilters } from '@/types';

/**
 * Dashboard page component
 * Displays the main items table with prices and filtering
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ members: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Pagination and sorting params
  const queryParams: PaginationParams & SortParams & ItemFilters = useMemo(() => ({
    page: currentPage,
    limit: pageSize,
    search: searchQuery || undefined,
    members: filters.members !== 'all' ? filters.members === 'members' : undefined,
    minPrice: filters.priceMin,
    maxPrice: filters.priceMax,
    // Note: Volume filters removed - volume not available in current prices
  }), [currentPage, pageSize, searchQuery, filters]);

  // Data fetching
  const {
    data: itemsResponse,
    isLoading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useItems(queryParams);

  const {
    data: pricesData,
    isLoading: pricesLoading,
    error: pricesError,
    refetch: refetchPrices,
  } = useAllCurrentPrices();

  // Combine items with prices
  const itemsWithPrices: ItemWithPrice[] = useMemo(() => {
    if (!itemsResponse?.data || !pricesData) return [];

    return itemsResponse.data.map(item => ({
      ...item,
      currentPrice: pricesData.find(price => price.itemId === item.itemId),
    }));
  }, [itemsResponse?.data, pricesData]);

  // Filter data based on price filters (client-side filtering)
  const filteredItems = useMemo(() => {
    return itemsWithPrices.filter(item => {
      const price = item.currentPrice;
      
      // Price filters - use high price as reference
      if (filters.priceMin && (!price?.highPrice || price.highPrice < filters.priceMin)) {
        return false;
      }
      if (filters.priceMax && (!price?.highPrice || price.highPrice > filters.priceMax)) {
        return false;
      }
      
      // Note: Volume filters removed - volume not available in current price snapshots
      // Volume is only available in timeseries data
      
      return true;
    });
  }, [itemsWithPrices, filters]);

  const isLoading = itemsLoading || pricesLoading;
  const error = itemsError || pricesError;

  const handleRefresh = () => {
    refetchItems();
    refetchPrices();
  };

  const handleRowClick = (item: ItemWithPrice) => {
    navigate(`/items/${item.itemId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when changing filters
  };

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
              onSearchChange={setSearchQuery}
              onRefresh={handleRefresh}
              onColumnsToggle={() => setShowFilters(!showFilters)}
              isRefreshing={isLoading}
              totalCount={itemsResponse?.meta?.total || 0}
              visibleCount={filteredItems.length}
            />

            {/* Items Table */}
            <ItemsTable
              data={filteredItems}
              isLoading={isLoading}
              error={error}
              onRowClick={handleRowClick}
              enableVirtualization={filteredItems.length > 200}
            />

            {/* Pagination */}
            {itemsResponse?.meta && (
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={itemsResponse.meta.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>

          {/* Export Button */}
          {filteredItems.length > 0 && (
            <div className="mt-4 flex justify-end">
              <ExportButton
                data={filteredItems}
                filename="osrs-ge-items"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

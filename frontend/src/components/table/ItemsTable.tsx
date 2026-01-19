/**
 * ItemsTable - Main data table component for displaying OSRS items
 * Features:
 * - Virtual scrolling for performance with 15K+ rows
 * - Column sorting and resizing
 * - Row selection
 * - Loading and error states
 */

import { ErrorDisplay, LoadingSpinner } from '@/components/common';
import { Stack, Text } from '@/components/ui';
import { useColumnVisibilityStore } from '@/stores/useColumnVisibilityStore';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef, useState } from 'react';
import { columns, type ItemWithPrice } from './columns';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';

export interface ItemsTableProps {
  data: ItemWithPrice[];
  isLoading?: boolean;
  error?: Error | null;
  enableVirtualization?: boolean;
  pageSize?: number;
}

export function ItemsTable({
  data,
  isLoading = false,
  error = null,
  enableVirtualization = true,
  pageSize = 100,
}: ItemsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { visibleColumns } = useColumnVisibilityStore();

  // Convert array of visible column IDs to VisibilityState object
  const columnVisibility = useMemo<VisibilityState>(() => {
    const visibility: VisibilityState = {};
    columns.forEach(col => {
      if (col.id) { // explicit check if id exists
        visibility[col.id] = visibleColumns.includes(col.id);
      }
    });
    return visibility;
  }, [visibleColumns]);

  const [rowSelection, setRowSelection] = useState({});

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    columnResizeMode: 'onChange',
  });

  // Set initial page size
  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  // Virtual scrolling setup
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // Reduced row height
    overscan: 10,
    enabled: enableVirtualization,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  // Loading state
  if (isLoading) {
    return (
      <Stack direction="col" align="center" justify="center" className="h-96">
        <LoadingSpinner size="lg" message="Loading items..." />
      </Stack>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <ErrorDisplay
          title="Failed to load items"
          error={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Stack direction="col" align="center" justify="center" className="h-96 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <Text as="h3" variant="heading" size="lg" className="mb-1">
          No items found
        </Text>
        <Text variant="muted">
          Try adjusting your filters or search query
        </Text>
      </Stack>
    );
  }

  return (
    <div className="w-full">
      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
        style={{ height: '600px' }}
      >
        <table className="w-full border-collapse">
          {/* Table Header */}
          <TableHeader
            headerGroups={table.getHeaderGroups()}
            tableState={table.getState()}
          />

          {/* Table Body with Virtual Scrolling */}
          <TableBody
            rows={rows}
            virtualRows={virtualRows}
            paddingTop={paddingTop}
            paddingBottom={paddingBottom}
            enableVirtualization={enableVirtualization}
          />
        </table>
      </div>

      {/* Table Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {rows.length.toLocaleString()} of {data.length.toLocaleString()} items
        </div>
        {rowSelection && Object.keys(rowSelection).length > 0 && (
          <div>
            {Object.keys(rowSelection).length} row(s) selected
          </div>
        )}
      </div>
    </div>
  );
}

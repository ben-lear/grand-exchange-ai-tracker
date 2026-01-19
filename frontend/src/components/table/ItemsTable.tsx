/**
 * ItemsTable - Main data table component for displaying OSRS items
 * Features:
 * - Virtual scrolling for performance with 15K+ rows
 * - Column sorting and resizing
 * - Row selection
 * - Loading and error states
 */

import { ErrorDisplay, LoadingSpinner } from '@/components/common';
import { Icon, Stack, Text } from '@/components/ui';
import { useColumnVisibilityStore } from '@/stores/useColumnVisibilityStore';
import {
  flexRender,
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
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { columns, type ItemWithPrice } from './columns';

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
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const customClassName = (header.column.columnDef.meta as any)?.cellClassName;
                  const baseClassName = customClassName || 'px-2';

                  return (
                    <th
                      key={header.id}
                      className={`${baseClassName} py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 relative`}
                      style={{
                        width: header.getSize(),
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {/* Column Header with Sort Button */}
                          {header.column.getCanSort() ? (
                            <button
                              className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getIsSorted() === 'asc' ? (
                                <Icon as={ArrowUp} size="sm" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <Icon as={ArrowDown} size="sm" />
                              ) : (
                                <Icon as={ArrowUpDown} size="sm" className="opacity-0 group-hover:opacity-50" />
                              )}
                            </button>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}

                          {/* Column Divider */}
                          {index < headerGroup.headers.length - 1 && (
                            <div className="absolute right-0 top-3 bottom-3 w-px bg-gray-200 dark:bg-gray-700" />
                          )}

                          {/* Column Resizer */}
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-500 ${header.column.getIsResizing() ? 'bg-blue-500' : ''
                                }`}
                              style={{
                                transform: header.column.getIsResizing()
                                  ? `translateX(${table.getState().columnSizingInfo.deltaOffset
                                  }px)`
                                  : '',
                              }}
                            />
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Table Body with Virtual Scrolling */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {enableVirtualization && paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {(enableVirtualization ? virtualRows.map(vr => rows[vr.index]) : rows).map((row) => {
              if (!row) return null;
              return (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const customClassName = (cell.column.columnDef.meta as any)?.cellClassName;
                    const baseClassName = customClassName || 'px-2';

                    return (
                      <td
                        key={cell.id}
                        className={`${baseClassName} py-3 text-sm text-gray-900 dark:text-gray-100 relative`}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        {cellIndex < row.getVisibleCells().length - 1 && (
                          <div className="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {enableVirtualization && paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
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

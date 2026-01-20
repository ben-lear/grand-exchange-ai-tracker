/**
 * TablePagination - Pagination controls for the items table
 * Features:
 * - Page size selector
 * - Page navigation
 * - Current page indicator
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { SelectOption } from '../ui';
import { Button, Icon, SingleSelect, Stack } from '../ui';

export interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [50, 100, 200, 500],
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Convert page size options to Select format
  const pageSizeSelectOptions: SelectOption<number>[] = pageSizeOptions.map((option) => ({
    value: option,
    label: String(option),
  }));

  const handleFirstPage = () => {
    if (canGoPrevious) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (canGoNext) {
      onPageChange(totalPages);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Left side - Page size selector */}
      <Stack direction="row" align="center" gap={2}>
        <label htmlFor="page-size-select" className="text-sm text-gray-700 dark:text-gray-300">
          Items per page:
        </label>
        <div className="w-24">
          <SingleSelect<number>
            id="page-size-select"
            value={pageSize}
            onChange={onPageSizeChange}
            options={pageSizeSelectOptions}
            size="sm"
          />
        </div>
      </Stack>

      {/* Center - Page info */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-medium">
          {startItem.toLocaleString()}
        </span>
        {' - '}
        <span className="font-medium">
          {endItem.toLocaleString()}
        </span>
        {' of '}
        <span className="font-medium">
          {totalItems.toLocaleString()}
        </span>
      </div>

      {/* Right side - Navigation buttons */}
      <Stack direction="row" align="center" gap={1}>
        <Button
          variant="toolbar"
          size="icon"
          onClick={handleFirstPage}
          disabled={!canGoPrevious}
          title="First page"
        >
          <Icon as={ChevronsLeft} size="md" />
        </Button>
        <Button
          variant="toolbar"
          size="icon"
          onClick={handlePreviousPage}
          disabled={!canGoPrevious}
          title="Previous page"
        >
          <Icon as={ChevronLeft} size="md" />
        </Button>

        {/* Page number display */}
        <div className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          Page{' '}
          <span className="font-semibold">{currentPage}</span>
          {' of '}
          <span className="font-semibold">{totalPages}</span>
        </div>

        <Button
          variant="toolbar"
          size="icon"
          onClick={handleNextPage}
          disabled={!canGoNext}
          title="Next page"
        >
          <Icon as={ChevronRight} size="md" />
        </Button>
        <Button
          variant="toolbar"
          size="icon"
          onClick={handleLastPage}
          disabled={!canGoNext}
          title="Last page"
        >
          <Icon as={ChevronsRight} size="md" />
        </Button>
      </Stack>
    </div>
  );
}

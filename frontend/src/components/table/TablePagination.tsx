/**
 * TablePagination - Pagination controls for the items table
 * Features:
 * - Page size selector
 * - Page navigation
 * - Current page indicator
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui';

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
      <div className="flex items-center gap-2">
        <label htmlFor="page-size-select" className="text-sm text-gray-700 dark:text-gray-300">
          Items per page:
        </label>
        <select
          id="page-size-select"
          name="pageSize"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

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
      <div className="flex items-center gap-1">
        <Button
          variant="toolbar"
          size="icon"
          onClick={handleFirstPage}
          disabled={!canGoPrevious}
          title="First page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="toolbar"
          size="icon"
          onClick={handlePreviousPage}
          disabled={!canGoPrevious}
          title="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
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
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button
          variant="toolbar"
          size="icon"
          onClick={handleLastPage}
          disabled={!canGoNext}
          title="Last page"
        >
          <ChevronsRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

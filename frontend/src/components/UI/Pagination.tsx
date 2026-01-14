interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className }: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Show 5 page numbers at a time

    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...');
    }

    // Add pages in range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className || ''}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded transition-colors ${
              currentPage === page
                ? 'bg-osrs-gold text-gray-900 font-bold'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="px-2 text-gray-500">
            {page}
          </span>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};

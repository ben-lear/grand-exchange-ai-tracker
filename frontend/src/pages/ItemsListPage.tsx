import { useState } from 'react';
import { useItems } from '../hooks';
import { ItemCard } from '../components/Item';
import { Pagination, ItemListSkeleton, SearchBar } from '../components/UI';
import { useFilterStore } from '../store';

export const ItemsListPage = () => {
  const [page, setPage] = useState(1);
  const { searchQuery, setSearchQuery } = useFilterStore();
  
  const { data, isLoading, error } = useItems({ 
    limit: 20, 
    page,
    search: searchQuery 
  });

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Items</h2>
          <p className="text-red-300">{error.message}</p>
        </div>
      </div>
    );
  }

  const items = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-osrs-gold mb-2">Items</h1>
        <p className="text-gray-400 mb-4">
          Browse all OSRS Grand Exchange items
        </p>
        
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search items..."
          isLoading={isLoading}
        />
      </div>

      {isLoading ? (
        <ItemListSkeleton count={20} />
      ) : items.length === 0 ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-400 text-lg">No items found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-osrs-gold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}

      {pagination && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {items.length} of {pagination.total} items
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { useItems } from '../hooks';
import { ItemCard } from '../components/Item';
import { Pagination, ItemListSkeleton, SearchBar, Button } from '../components/UI';
import { useFilterStore } from '../store';

type SortOption = 'name' | 'price';
type SortOrder = 'asc' | 'desc';

export const ItemsListPage = () => {
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const { searchQuery, setSearchQuery } = useFilterStore();
  
  const { data, isLoading, error } = useItems({ 
    limit: 20, 
    page,
    search: searchQuery,
    members: members !== null ? members : undefined,
    sort: sortBy,
    order: sortOrder
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

  const items = data?.data || [];
  const pagination = data?.pagination;

  const handleClearFilters = () => {
    setMembers(null);
    setSortBy('name');
    setSortOrder('asc');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filter Sidebar */}
      <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 sticky top-20 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-osrs-gold mb-3">Filters</h3>
            
            {/* Members Filter */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400">Membership</p>
              <div className="space-y-2">
                <button
                  onClick={() => setMembers(null)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    members === null
                      ? 'bg-osrs-gold text-gray-900 font-medium'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setMembers(true)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    members === true
                      ? 'bg-osrs-gold text-gray-900 font-medium'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Members Only
                </button>
                <button
                  onClick={() => setMembers(false)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    members === false
                      ? 'bg-osrs-gold text-gray-900 font-medium'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Free-to-Play
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <p className="text-sm font-medium text-gray-400">Sort By</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded text-sm border border-gray-600 focus:border-osrs-gold focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400">Order</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    sortOrder === 'asc'
                      ? 'bg-osrs-gold text-gray-900 font-medium'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ↑ Asc
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    sortOrder === 'desc'
                      ? 'bg-osrs-gold text-gray-900 font-medium'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ↓ Desc
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-osrs-gold">Items</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
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
            <div className="text-center bg-gray-800 rounded-lg p-8 border border-gray-700">
              <p className="text-gray-400 text-lg mb-2">No items found</p>
              {(searchQuery || members !== null) && (
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-osrs-gold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
    </div>
  );
};

import { useItems } from '../hooks';
import { formatRelativeTime } from '../utils';

export const ItemsListPage = () => {
  const { data, isLoading, error } = useItems({ limit: 20, page: 1 });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-400">Loading items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-400">Error loading items: {error.message}</div>
      </div>
    );
  }

  if (!data?.data?.data || data.data.data.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-400">No items found</div>
      </div>
    );
  }

  const items = data.data.data;
  const pagination = data.data.pagination;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-osrs-gold mb-2">Items</h1>
        <p className="text-gray-400">
          Showing {items.length} of {pagination.total} items
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-osrs-gold transition-colors"
          >
            <div className="flex items-start gap-3">
              <img
                src={item.icon_url}
                alt={item.name}
                className="w-12 h-12"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/48';
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{item.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {item.members && (
                    <span className="px-2 py-0.5 bg-osrs-gold bg-opacity-20 text-osrs-gold text-xs rounded">
                      Members
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(item.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex gap-2">
          <button
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-gray-800 text-white rounded">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            disabled={pagination.page === pagination.total_pages}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

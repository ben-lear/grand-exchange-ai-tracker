import { Link } from 'react-router-dom';
import { useWatchlistStore } from '../store';
import { useItems } from '../hooks';
import { ItemCard } from '../components/Item';
import { ItemListSkeleton, Button } from '../components/UI';

export const WatchlistPage = () => {
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlistStore();
  
  // Fetch items from watchlist
  // Note: This is a simplified version. In production, you'd want a dedicated API endpoint
  // that accepts multiple item IDs to fetch them efficiently
  const { data, isLoading } = useItems({ 
    limit: 100, 
    page: 1 
  });

  const items = data?.data?.data || [];
  const watchlistIds = watchlist.map(item => item.itemId);
  const watchlistItems = items.filter(item => watchlistIds.includes(item.item_id));

  const handleRemove = (itemId: number) => {
    removeFromWatchlist(itemId);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire watchlist?')) {
      clearWatchlist();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-osrs-gold mb-2">⭐ My Watchlist</h1>
            <p className="text-gray-400">
              Track your favorite items and monitor their prices
            </p>
          </div>
          {watchlist.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Watchlist Stats */}
      {watchlist.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Watched Items</p>
            <p className="text-2xl font-bold text-osrs-gold">{watchlist.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-green-400">Coming Soon</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Avg Change</p>
            <p className="text-2xl font-bold text-blue-400">Coming Soon</p>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {isLoading ? (
        <ItemListSkeleton count={watchlist.length || 6} />
      ) : watchlist.length === 0 ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center max-w-md">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h2>
            <p className="text-gray-400 mb-6">
              Start adding items to your watchlist to track their prices and trends
            </p>
            <Link to="/items">
              <Button variant="primary">Browse Items</Button>
            </Link>
          </div>
        </div>
      ) : watchlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {watchlistItems.map((item) => (
            <div key={item.id} className="relative group">
              <ItemCard item={item} />
              <button
                onClick={() => handleRemove(item.item_id)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                title="Remove from watchlist"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <p className="text-gray-400">
            Items in your watchlist are not currently loaded. Try refreshing the page.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-osrs-gold/10 border border-osrs-gold/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-osrs-gold mb-2">💡 Watchlist Tips</h3>
        <ul className="text-gray-300 text-sm space-y-2">
          <li>• Click the star icon on any item to add it to your watchlist</li>
          <li>• Your watchlist is saved locally in your browser</li>
          <li>• Hover over an item card to quickly remove it</li>
          <li>• Use the watchlist to monitor high-value items or flipping opportunities</li>
        </ul>
      </div>
    </div>
  );
};

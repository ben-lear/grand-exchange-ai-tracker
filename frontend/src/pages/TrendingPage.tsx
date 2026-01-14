import { useState } from 'react';
import { useTrendingItems } from '../hooks';
import { ItemCard } from '../components/Item';
import { ItemListSkeleton, Button } from '../components/UI';

type TimeFrame = '24h' | '7d' | '30d';

export const TrendingPage = () => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('24h');
  const [limit, setLimit] = useState(20);
  
  const { data, isLoading, error } = useTrendingItems({ limit, timeframe });

  const items = data?.data || [];

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
  ];

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Trending Items</h2>
          <p className="text-red-300">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h1 className="text-3xl font-bold text-osrs-gold mb-2">🔥 Trending Items</h1>
        <p className="text-gray-400">
          Most searched and viewed items on the Grand Exchange
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-400 font-medium">Time Period:</span>
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => {
              setTimeframe(tf.value);
              setLimit(20); // Reset limit when changing timeframe
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf.value
                ? 'bg-osrs-gold text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <ItemListSkeleton count={20} />
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((trendingItem: any, index: number) => (
              <div key={trendingItem.item.id} className="relative">
                <ItemCard item={trendingItem.item} />
                {index < 3 && (
                  <div className="absolute top-2 left-2 w-8 h-8 bg-osrs-gold rounded-full flex items-center justify-center font-bold text-gray-900 shadow-lg">
                    {index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {items.length >= limit && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}

          {/* Items Count */}
          <div className="text-center text-sm text-gray-400">
            Showing {items.length} trending items
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <p className="text-gray-400 text-lg">No trending items available</p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later for trending data
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-2">💡 How Trending Works</h3>
        <p className="text-gray-300 text-sm">
          Items are ranked based on search volume, price volatility, and trading activity. 
          The trending list updates frequently to reflect current market interest.
        </p>
      </div>
    </div>
  );
};

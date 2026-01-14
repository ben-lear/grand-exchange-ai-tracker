import { Link } from 'react-router-dom';
import { useTrendingItems, useBiggestMovers } from '../hooks';
import { ItemCard } from '../components/Item';
import { ItemListSkeleton, Button } from '../components/UI';

export const DashboardPage = () => {
  const { data: trendingData, isLoading: trendingLoading } = useTrendingItems({ limit: 8, timeframe: '24h' });
  const { data: gainersData, isLoading: gainersLoading } = useBiggestMovers({ direction: 'gainers', limit: 4 });
  const { data: losersData, isLoading: losersLoading } = useBiggestMovers({ direction: 'losers', limit: 4 });

  const trending = trendingData?.data || [];
  const gainers = gainersData?.data || [];
  const losers = losersData?.data || [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-b from-gray-800/50 to-transparent rounded-lg border border-gray-700">
        <h1 className="text-4xl md:text-5xl font-bold text-osrs-gold mb-4">
          OSRS Grand Exchange Tracker
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Track real-time prices, analyze trends, and make informed trading decisions
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/items">
            <Button variant="primary" size="lg">
              Browse Items
            </Button>
          </Link>
          <Link to="/trending">
            <Button variant="outline" size="lg">
              View Trending
            </Button>
          </Link>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-osrs-gold/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-white">2,000+</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tracked daily</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Price Updates</p>
              <p className="text-2xl font-bold text-white">Every 5min</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">For popular items</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Data History</p>
              <p className="text-2xl font-bold text-white">180 Days</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Price tracking</p>
        </div>
      </section>

      {/* Trending Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-osrs-gold">🔥 Trending Items</h2>
            <p className="text-gray-400 text-sm">Most searched in the last 24 hours</p>
          </div>
          <Link to="/trending">
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </Link>
        </div>
        
        {trendingLoading ? (
          <ItemListSkeleton count={8} />
        ) : trending.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((trendingItem: any) => (
              <ItemCard key={trendingItem.item.id} item={trendingItem.item} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center text-gray-400">
            No trending items available
          </div>
        )}
      </section>

      {/* Biggest Movers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-green-400">📈 Biggest Gainers</h2>
              <p className="text-gray-400 text-sm">Largest price increases today</p>
            </div>
          </div>
          
          {gainersLoading ? (
            <ItemListSkeleton count={4} />
          ) : gainers.length > 0 ? (
            <div className="space-y-3">
              {gainers.map((mover: any) => (
                <div key={mover.item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-500 transition-colors">
                  <Link to={`/items/${mover.item.item_id}`} className="flex items-center gap-3">
                    <img
                      src={mover.item.icon_url}
                      alt={mover.item.name}
                      className="w-12 h-12"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/48?text=OSRS';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{mover.item.name}</h3>
                      <p className="text-sm text-green-400">
                        +{mover.price_change_percent?.toFixed(2)}% today
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Losers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-red-400">📉 Biggest Losers</h2>
              <p className="text-gray-400 text-sm">Largest price decreases today</p>
            </div>
          </div>
          
          {losersLoading ? (
            <ItemListSkeleton count={4} />
          ) : losers.length > 0 ? (
            <div className="space-y-3">
              {losers.map((mover: any) => (
                <div key={mover.item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500 transition-colors">
                  <Link to={`/items/${mover.item.item_id}`} className="flex items-center gap-3">
                    <img
                      src={mover.item.icon_url}
                      alt={mover.item.name}
                      className="w-12 h-12"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/48?text=OSRS';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{mover.item.name}</h3>
                      <p className="text-sm text-red-400">
                        {mover.price_change_percent?.toFixed(2)}% today
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-osrs-gold/10 to-orange-500/10 rounded-lg p-8 border border-osrs-gold/30 text-center">
        <h2 className="text-2xl font-bold text-osrs-gold mb-2">Start Tracking Your Items</h2>
        <p className="text-gray-300 mb-6">
          Create a watchlist to monitor prices and get alerts on your favorite items
        </p>
        <Link to="/watchlist">
          <Button variant="primary" size="lg">
            Go to Watchlist
          </Button>
        </Link>
      </section>
    </div>
  );
};

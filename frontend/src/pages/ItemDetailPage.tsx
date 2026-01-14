import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useItemDetail, usePriceGraph } from '../hooks';
import { PriceChart } from '../components/Charts';
import { ItemBadge, PriceDisplay, TrendIndicator } from '../components/Item';
import { Button, LoadingSkeleton } from '../components/UI';
import { useWatchlistStore } from '../store';
import { formatRelativeTime } from '../utils';
import type { TimeRange, Item, PriceTrend } from '../types';

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const itemId = parseInt(id || '0', 10);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  const { data: itemData, isLoading: itemLoading, error: itemError } = useItemDetail(itemId);
  const { data: graphData, isLoading: graphLoading } = usePriceGraph(itemId, timeRange);
  
  const { addToWatchlist, removeFromWatchlist, isInWatchlist: checkInWatchlist } = useWatchlistStore();
  const isInWatchlist = checkInWatchlist(itemId);

  if (itemLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="rect" className="h-32" />
        <LoadingSkeleton variant="rect" className="h-96" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      </div>
    );
  }

  if (itemError || !itemData?.data) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Item Not Found</h2>
          <p className="text-red-300 mb-4">
            {itemError?.message || 'The requested item could not be found.'}
          </p>
          <Link to="/items">
            <Button variant="outline">Browse Items</Button>
          </Link>
        </div>
      </div>
    );
  }

  const responseData = itemData.data as any; // Backend returns {data: Item, trend: PriceTrend} not nested
  const item = responseData as Item;
  const trend = responseData.trend as PriceTrend | undefined;
  const priceHistory = graphData?.data ? (graphData.data as any).prices?.map((price: number, idx: number) => ({
    timestamp: (graphData.data as any).timestamps[idx],
    price
  })) : [];

  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      removeFromWatchlist(itemId);
    } else {
      addToWatchlist(itemId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Item Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <img
              src={item.icon_large_url || item.icon_url}
              alt={item.name}
              className="w-32 h-32"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/128?text=OSRS';
              }}
            />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold text-osrs-gold mb-2">{item.name}</h1>
              <p className="text-gray-300">{item.description}</p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {item.members ? (
                <ItemBadge type="members" />
              ) : (
                <ItemBadge type="free" />
              )}
              <span className="text-sm text-gray-500">
                Item ID: {item.item_id}
              </span>
              <span className="text-sm text-gray-500">
                Last updated: {formatRelativeTime(item.updated_at)}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                variant={isInWatchlist ? 'secondary' : 'primary'}
                onClick={handleWatchlistToggle}
              >
                {isInWatchlist ? '⭐ Remove from Watchlist' : '☆ Add to Watchlist'}
              </Button>
              <Button variant="outline" onClick={() => window.open(`https://oldschool.runescape.wiki/w/${encodeURIComponent(item.name)}`, '_blank')}>
                View on Wiki →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Price Information */}
      {trend && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Current Price</h3>
            <PriceDisplay 
              price={trend.current_price} 
              trend={trend.current_trend}
              size="lg"
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">30 Day Change</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-400">
                {trend.day30_change || 'N/A'}
              </span>
              <TrendIndicator 
                trend={trend.day30_trend} 
                size="lg"
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">90 Day Change</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-400">
                {trend.day90_change || 'N/A'}
              </span>
              <TrendIndicator 
                trend={trend.day90_trend} 
                size="lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      <div>
        <h2 className="text-2xl font-bold text-osrs-gold mb-4">Price History</h2>
        <PriceChart
          data={priceHistory}
          variant="area"
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          isLoading={graphLoading}
        />
      </div>

      {/* Additional Statistics */}
      {trend && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-osrs-gold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Today's Change</p>
              <p className="text-lg font-bold text-gray-400">
                {trend.today_price_change?.toLocaleString()} gp
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">30 Day Change</p>
              <p className="text-lg font-bold text-gray-400">
                {trend.day30_change || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">90 Day Change</p>
              <p className="text-lg font-bold text-gray-400">
                {trend.day90_change || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">180 Day Change</p>
              <p className="text-lg font-bold text-gray-400">
                {trend.day180_change || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Trend</p>
              <TrendIndicator trend={trend.current_trend} size="md" showLabel />
            </div>
            <div>
              <p className="text-sm text-gray-400">Today's Trend</p>
              <TrendIndicator trend={trend.today_trend} size="md" showLabel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

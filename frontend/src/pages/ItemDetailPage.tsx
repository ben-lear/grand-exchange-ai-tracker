/**
 * Item detail page - Shows detailed information about a single item
 * Route: /items/:id/:slug (slug is optional for backward compatibility)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { PriceChart, TimePeriodSelector } from '@/components/charts';
import { LoadingSpinner, ErrorDisplay } from '@/components/common';
import { useItem, useCurrentPrice, usePriceHistory } from '@/hooks';
import { formatGold, formatSpread, formatMarginPercent, formatRelativeTime, getItemUrl } from '@/utils';
import type { TimePeriod } from '@/types';

/**
 * Item detail page component
 * Shows item details, current price, and charts
 */
export const ItemDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const itemId = id ? parseInt(id, 10) : 0;
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

  // Fetch item data
  const {
    data: item,
    isLoading: itemLoading,
    error: itemError,
  } = useItem(itemId);

  // Fetch current price
  const {
    data: currentPrice,
    isLoading: priceLoading,
  } = useCurrentPrice(itemId);

  // Fetch price history
  const {
    data: priceHistory,
    isLoading: historyLoading,
    error: historyError,
  } = usePriceHistory(itemId, selectedPeriod);

  // Redirect to proper slug URL if item is loaded and slug is missing/incorrect
  useEffect(() => {
    if (item && !slug) {
      const correctUrl = getItemUrl(item.itemId, item.name);
      navigate(correctUrl, { replace: true });
    }
  }, [item, slug, navigate]);

  // Update page title
  useEffect(() => {
    if (item) {
      document.title = `${item.name} - OSRS Grand Exchange Tracker`;
    }
    return () => {
      document.title = 'OSRS Grand Exchange Tracker';
    };
  }, [item]);

  // Handle loading state
  if (itemLoading || priceLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" message="Loading item details..." />
      </div>
    );
  }

  // Handle errors
  if (itemError) {
    return (
      <ErrorDisplay
        error={itemError}
        title="Failed to load item"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!item) {
    return (
      <ErrorDisplay
        error="The requested item could not be found."
        title="Item Not Found"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Item Header */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-start gap-6">
          {/* Item Icon */}
          <div className="flex-shrink-0">
            {item.iconUrl ? (
              <img
                src={item.iconUrl}
                alt={item.name}
                className="w-24 h-24 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2"
                onError={(e) => {
                  // Fallback if icon fails to load
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23999"%3E?%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-3xl">
                ?
              </div>
            )}
          </div>

          {/* Item Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h1>
                  {item.members && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Members
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Item ID: <span className="font-mono font-semibold">{item.itemId}</span>
                </p>
                {item.description && (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Price Card */}
      {currentPrice && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Current Prices
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Updated: {formatRelativeTime(currentPrice.updatedAt)}
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Buy Price (High)</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {currentPrice.highPrice ? formatGold(currentPrice.highPrice) : '—'}
              </div>
              {currentPrice.highPriceTime && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(currentPrice.highPriceTime)}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sell Price (Low)</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {currentPrice.lowPrice ? formatGold(currentPrice.lowPrice) : '—'}
              </div>
              {currentPrice.lowPriceTime && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(currentPrice.lowPriceTime)}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Mid Price</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentPrice.highPrice && currentPrice.lowPrice 
                  ? formatGold(Math.round((currentPrice.highPrice + currentPrice.lowPrice) / 2))
                  : currentPrice.highPrice 
                    ? formatGold(currentPrice.highPrice)
                    : currentPrice.lowPrice 
                      ? formatGold(currentPrice.lowPrice)
                      : '—'
                }
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Average of buy/sell
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Flip Margin</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatSpread(currentPrice.highPrice, currentPrice.lowPrice)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatMarginPercent(currentPrice.highPrice, currentPrice.lowPrice)} profit
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Price History
          </h2>
          <TimePeriodSelector
            activePeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            disabled={historyLoading}
          />
        </div>
        
        <PriceChart
          data={priceHistory?.data || []}
          isLoading={historyLoading}
          error={historyError}
          period={selectedPeriod}
          itemName={item.name}
          height={400}
        />
      </div>

      {/* Item Details */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Item Metadata
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Buy Limit
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {item.buyLimit > 0 ? (
                <>
                  {item.buyLimit.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ 4h</span>
                </>
              ) : (
                <span className="text-gray-400">Unknown</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Membership
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {item.members ? 'Members Only' : 'Free-to-Play'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              High Alchemy
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {item.highAlch > 0 ? formatGold(item.highAlch) : <span className="text-gray-400">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Low Alchemy
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {item.lowAlch > 0 ? formatGold(item.lowAlch) : <span className="text-gray-400">—</span>}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

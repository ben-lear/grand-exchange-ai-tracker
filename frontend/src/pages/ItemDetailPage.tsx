/**
 * Item detail page - Shows detailed information about a single item
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Loading, ErrorDisplay } from '../components/common';
import { useItem, useCurrentPrice } from '../hooks';

/**
 * Item detail page component
 * Shows item details, current price, and charts
 */
export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const itemId = id ? parseInt(id, 10) : 0;

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

  // Handle loading state
  if (itemLoading || priceLoading) {
    return <Loading size="lg" message="Loading item details..." />;
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
        error="Item not found"
        title="Item Not Found"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Item Header */}
      <div className="flex items-start gap-4">
        <img
          src={item.iconUrl}
          alt={item.name}
          className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-800"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {item.name}
            </h1>
            {item.members && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                Members
              </span>
            )}
          </div>
          {item.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Current Price Card */}
      {currentPrice && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Current Price</h2>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentPrice.price.toLocaleString()} GP
          </div>
        </div>
      )}

      {/* Item Details */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-lg font-semibold mb-4">Item Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Item ID
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {item.itemId}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Buy Limit
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {item.buyLimit.toLocaleString()} / 4 hours
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              High Alch
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {item.highAlch.toLocaleString()} GP
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Low Alch
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {item.lowAlch.toLocaleString()} GP
            </dd>
          </div>
        </dl>
      </div>

      {/* Placeholder for charts */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">Price Chart</p>
          <p className="text-sm">Coming in Phase 5 - Frontend Features</p>
        </div>
      </div>
    </div>
  );
};

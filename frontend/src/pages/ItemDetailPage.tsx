/**
 * Item detail page - Shows detailed information about a single item
 * Route: /items/:id/:slug (slug is optional for backward compatibility)
 */

import { BackButton, ErrorDisplay, LoadingSpinner } from '@/components/common';
import { CurrentPriceCard, ItemHeader, ItemMetadata, PriceChartSection } from '@/components/item';
import { useCurrentPrice, useItem, usePriceStream } from '@/hooks';
import type { TimePeriod } from '@/types';
import { getItemUrl } from '@/utils';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

  // Connect to SSE for real-time updates
  const {
    isConnected: sseConnected,
    reconnectCount: sseReconnectCount,
    lastHeartbeatAt,
  } = usePriceStream({
    itemIds: [itemId],
    enabled: true,
  });

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
      <BackButton />

      {/* Item Header */}
      <ItemHeader item={item} />

      {/* Current Price Card */}
      {currentPrice && <CurrentPriceCard price={currentPrice} />}

      {/* Price Chart */}
      <PriceChartSection
        itemId={itemId}
        itemName={item.name}
        period={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        isConnected={sseConnected}
        lastHeartbeatAt={lastHeartbeatAt ? lastHeartbeatAt.getTime() : null}
        reconnectCount={sseReconnectCount}
      />

      {/* Item Metadata */}
      <ItemMetadata item={item} />
    </div>
  );
};
/**
 * Main layout component that wraps all pages
 * 
 * Responsibilities:
 * - Prefetch all items on app mount (background loading)
 * - Sync prices to itemDataStore on every refetch
 * - Handle global keyboard shortcuts (Ctrl+K for search)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useItemPrefetcher } from '../../hooks/useItemPrefetcher';
import { useAllCurrentPrices } from '../../hooks/usePrices';
import { useItemDataStore } from '../../stores/itemDataStore';
import { cn } from '../../utils';
import { Footer } from './Footer';
import { Header, type HeaderHandle } from './Header';

export interface MainLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * MainLayout component - wraps all application pages
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  const headerRef = useRef<HeaderHandle>(null);
  const { setPrices } = useItemDataStore();

  // Start background prefetch of all items on app mount
  useItemPrefetcher();

  // Fetch prices on mount with auto-refetch every 60s
  const { data: prices } = useAllCurrentPrices({
    refetchInterval: 60_000,
    staleTime: 50_000,
  });

  // Sync prices to store whenever they update (initial + refetches)
  useEffect(() => {
    if (prices) {
      setPrices(prices);
    }
  }, [prices, setPrices]);

  // Focus search on Ctrl+K / Cmd+K
  const handleFocusSearch = useCallback(() => {
    headerRef.current?.focusSearch();
  }, []);

  // Global keyboard listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleFocusSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleFocusSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Skip to main content link - visible on focus for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <Header ref={headerRef} />

      {/* Main Content */}
      <main id="main-content" className={cn('flex-1 container mx-auto px-4 py-8', className)}>
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

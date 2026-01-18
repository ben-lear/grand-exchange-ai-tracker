/**
 * Header component for the main layout
 */

import { Bell, Menu, Search, Settings } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../stores';
import { cn } from '../../utils';
import { GlobalSearch, type GlobalSearchHandle } from '../search';
import { Button } from '../ui';

export interface HeaderProps {
  className?: string;
}

export interface HeaderHandle {
  /** Focus the search input (for Ctrl+K) */
  focusSearch: () => void;
}

/**
 * Header component with navigation and global search
 */
export const Header = forwardRef<HeaderHandle, HeaderProps>(
  ({ className }, ref) => {
    const { toggleMobileMenu } = useUIStore();
    const searchRef = useRef<GlobalSearchHandle>(null);

    // Expose focusSearch method to parent (MainLayout)
    useImperativeHandle(ref, () => ({
      focusSearch: () => searchRef.current?.focus(),
    }));

    return (
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle mobile menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">GE</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    OSRS GE Tracker
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Grand Exchange Price Tracker
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: Global Search (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <GlobalSearch ref={searchRef} id="global-search-desktop" className="w-full" />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile search button - focuses the search on click */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => searchRef.current?.focus()}
                className="md:hidden"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              <Link
                to="/settings"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: Global Search - shown below header on mobile */}
        <div className="md:hidden px-4 pb-3">
          <GlobalSearch id="global-search-mobile" className="w-full" />
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
/**
 * Header component for the main layout
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, Bell, Settings } from 'lucide-react';
import { useUIStore } from '../../stores';
import { cn } from '../../utils';

export interface HeaderProps {
  className?: string;
}

/**
 * Header component with navigation and actions
 */
export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { toggleMobileMenu, setSearchModalOpen } = useUIStore();

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

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search items...</span>
              <kbd className="ml-auto hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            
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
    </header>
  );
};

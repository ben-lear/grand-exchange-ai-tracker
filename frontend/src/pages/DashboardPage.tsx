/**
 * Dashboard page - Main page with items table
 */

import React from 'react';

/**
 * Dashboard page component
 * Will display the main items table with prices
 */
export const DashboardPage: React.FC = () => {
  // TODO: Implement items table in Phase 5
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Grand Exchange Items
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse and track all OSRS Grand Exchange items and their current prices
          </p>
        </div>
      </div>

      {/* Placeholder for items table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">Items Table</p>
          <p className="text-sm">Coming in Phase 5 - Frontend Features</p>
        </div>
      </div>
    </div>
  );
};

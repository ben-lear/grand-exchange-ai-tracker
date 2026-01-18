/**
 * FilterPanel - Advanced filtering controls for the items table
 * Features:
 * - Price range filter
 * - Volume range filter
 * - Members filter (P2P/F2P/All)
 * - Clear all filters
 */

import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface FilterState {
  priceMin?: number;
  priceMax?: number;
  volumeMin?: number;
  volumeMax?: number;
  members?: 'all' | 'members' | 'f2p';
}

export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose?: () => void;
  className?: string;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onClose,
  className = '',
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      members: 'all',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.priceMin !== undefined ||
      localFilters.priceMax !== undefined ||
      localFilters.volumeMin !== undefined ||
      localFilters.volumeMax !== undefined ||
      (localFilters.members && localFilters.members !== 'all')
    );
  };

  const handlePriceMinChange = (value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    setLocalFilters({ ...localFilters, priceMin: num });
  };

  const handlePriceMaxChange = (value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    setLocalFilters({ ...localFilters, priceMax: num });
  };

  const handleVolumeMinChange = (value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    setLocalFilters({ ...localFilters, volumeMin: num });
  };

  const handleVolumeMaxChange = (value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    setLocalFilters({ ...localFilters, volumeMax: num });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filters
          </h3>
          {hasActiveFilters() && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Active
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        {/* Members Filter */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Membership
          </legend>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Items', id: 'membership-all' },
              { value: 'members', label: 'Members Only (P2P)', id: 'membership-members' },
              { value: 'f2p', label: 'Free-to-Play', id: 'membership-f2p' },
            ].map((option) => (
              <label key={option.value} htmlFor={option.id} className="flex items-center">
                <input
                  id={option.id}
                  type="radio"
                  name="members"
                  value={option.value}
                  checked={localFilters.members === option.value}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      members: e.target.value as FilterState['members'],
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price Range (GP)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-price-min" className="sr-only">
                Minimum Price
              </label>
              <input
                id="filter-price-min"
                name="priceMin"
                type="number"
                placeholder="Min"
                value={localFilters.priceMin ?? ''}
                onChange={(e) => handlePriceMinChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label htmlFor="filter-price-max" className="sr-only">
                Maximum Price
              </label>
              <input
                id="filter-price-max"
                name="priceMax"
                type="number"
                placeholder="Max"
                value={localFilters.priceMax ?? ''}
                onChange={(e) => handlePriceMaxChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Volume Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Daily Volume
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-volume-min" className="sr-only">
                Minimum Volume
              </label>
              <input
                id="filter-volume-min"
                name="volumeMin"
                type="number"
                placeholder="Min"
                value={localFilters.volumeMin ?? ''}
                onChange={(e) => handleVolumeMinChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label htmlFor="filter-volume-max" className="sr-only">
                Maximum Volume
              </label>
              <input
                id="filter-volume-max"
                name="volumeMax"
                type="number"
                placeholder="Max"
                value={localFilters.volumeMax ?? ''}
                onChange={(e) => handleVolumeMaxChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={handleApply}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Apply Filters
        </button>
        {hasActiveFilters() && (
          <button
            onClick={handleClear}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}

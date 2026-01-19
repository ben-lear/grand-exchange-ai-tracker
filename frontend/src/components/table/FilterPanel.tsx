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
import { Button, Icon, Input, Radio, Stack } from '../ui';

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
      <Stack direction="row" align="center" justify="between" className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Stack direction="row" align="center" gap={2}>
          <Icon as={SlidersHorizontal} size="md" color="muted" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filters
          </h3>
          {hasActiveFilters() && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Active
            </span>
          )}
        </Stack>
        {onClose && (
          <Button
            variant="close"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close filters"
          >
            <Icon as={X} size="md" />
          </Button>
        )}
      </Stack>

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
              <Radio
                key={option.value}
                id={option.id}
                name="members"
                value={option.value}
                label={option.label}
                checked={localFilters.members === option.value}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    members: e.target.value as FilterState['members'],
                  })
                }
              />
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
              <Input
                id="filter-price-min"
                name="priceMin"
                type="number"
                placeholder="Min"
                value={localFilters.priceMin ?? ''}
                onChange={(e) => handlePriceMinChange(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="filter-price-max" className="sr-only">
                Maximum Price
              </label>
              <Input
                id="filter-price-max"
                name="priceMax"
                type="number"
                placeholder="Max"
                value={localFilters.priceMax ?? ''}
                onChange={(e) => handlePriceMaxChange(e.target.value)}
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
              <Input
                id="filter-volume-min"
                name="volumeMin"
                type="number"
                placeholder="Min"
                value={localFilters.volumeMin ?? ''}
                onChange={(e) => handleVolumeMinChange(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="filter-volume-max" className="sr-only">
                Maximum Volume
              </label>
              <Input
                id="filter-volume-max"
                name="volumeMax"
                type="number"
                placeholder="Max"
                value={localFilters.volumeMax ?? ''}
                onChange={(e) => handleVolumeMaxChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <Button
          variant="primary"
          width="full"
          onClick={handleApply}
        >
          Apply Filters
        </Button>
        {hasActiveFilters() && (
          <Button
            variant="secondary"
            width="full"
            onClick={handleClear}
          >
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  );
}

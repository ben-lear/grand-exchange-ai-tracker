/**
 * SearchDropdownContent - Reusable content component for search dropdowns
 *
 * Renders either recent searches, search results, or a no results message.
 * Extracted from GlobalSearch.tsx for reuse in other search components.
 */

import { Text } from '@/components/ui';
import React from 'react';
import type { Item } from '../../types';
import { DropdownItem } from '../common/DropdownItem';

export interface SearchDropdownContentProps<T extends { itemId: number }> {
  /** Whether to show recent searches */
  showRecent: boolean;
  /** Whether to show search results */
  showResults: boolean;
  /** Whether to show no results message */
  showNoResults: boolean;
  /** Recent search items (generic type for flexibility) */
  recentItems: T[];
  /** Search result items */
  searchResults: Item[];
  /** Currently selected item index */
  selectedIndex: number;
  /** Search query (used in no results message) */
  query: string;
  /** Callback when an item is selected */
  onSelectItem: (item: T | Item) => void;
  /** Callback when an item is hovered */
  onHoverItem: (index: number) => void;
  /** Render function for recent search items */
  renderRecentItem: (item: T, onRemove?: (itemId: number) => void) => React.ReactNode;
  /** Render function for search result items */
  renderResultItem: (item: Item) => React.ReactNode;
  /** Optional callback to remove recent item */
  onRemoveRecent?: (itemId: number) => void;
  /** Header text for recent searches (default: "Recent Searches") */
  recentHeader?: string;
}

/**
 * Generic search dropdown content renderer
 *
 * @example
 * ```tsx
 * <SearchDropdownContent
 *   showRecent={!query && recentItems.length > 0}
 *   showResults={query && searchResults.length > 0}
 *   showNoResults={query && searchResults.length === 0}
 *   recentItems={recentItems}
 *   searchResults={searchResults}
 *   selectedIndex={selectedIndex}
 *   query={query}
 *   onSelectItem={selectItem}
 *   onHoverItem={setSelectedIndex}
 *   renderRecentItem={(item, onRemove) => (
 *     <RecentSearchItem item={item} onRemove={onRemove} />
 *   )}
 *   renderResultItem={(item) => (
 *     <SearchResultItem item={item} price={getPrice(item.itemId)} />
 *   )}
 *   onRemoveRecent={removeRecentItem}
 * />
 * ```
 */
export function SearchDropdownContent<T extends { itemId: number }>({
  showRecent,
  showResults,
  showNoResults,
  recentItems,
  searchResults,
  selectedIndex,
  query,
  onSelectItem,
  onHoverItem,
  renderRecentItem,
  renderResultItem,
  onRemoveRecent,
  recentHeader = 'Recent Searches',
}: SearchDropdownContentProps<T>): React.ReactElement | null {
  return (
    <>
      {/* Recent Searches */}
      {showRecent && (
        <>
          <li className="px-3 py-2 bg-gray-50 dark:bg-gray-750">
            <Text variant="muted" size="xs" weight="medium">
              {recentHeader}
            </Text>
          </li>
          {recentItems.map((item, index) => (
            <DropdownItem
              key={item.itemId}
              isSelected={selectedIndex === index}
              onClick={() => onSelectItem(item)}
              onMouseEnter={() => onHoverItem(index)}
              data-index={index}
            >
              {renderRecentItem(item, onRemoveRecent)}
            </DropdownItem>
          ))}
        </>
      )}

      {/* Search Results */}
      {showResults &&
        searchResults.map((item, index) => (
          <DropdownItem
            key={item.itemId}
            isSelected={selectedIndex === index}
            onClick={() => onSelectItem(item)}
            onMouseEnter={() => onHoverItem(index)}
            data-index={index}
          >
            {renderResultItem(item)}
          </DropdownItem>
        ))}

      {/* No Results */}
      {showNoResults && (
        <li className="px-3 py-4 text-center">
          <Text variant="muted">No items found for "{query}"</Text>
        </li>
      )}
    </>
  );
}

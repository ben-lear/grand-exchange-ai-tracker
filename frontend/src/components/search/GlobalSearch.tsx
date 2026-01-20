/**
 * Global search component for the header
 * Combines SearchInput, Dropdown, and item search logic
 */

import { Text } from '@/components/ui';
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useRecentSearches, type RecentItem } from '../../hooks/useRecentSearches';
import { useSearchKeyboard } from '../../hooks/useSearchKeyboard';
import { useItemDataStore } from '../../stores/itemDataStore';
import type { Item } from '../../types';
import { createItemSearchIndex, searchItems } from '../../utils/itemSearch';
import { Dropdown } from '../common/Dropdown';
import { DropdownItem } from '../common/DropdownItem';
import { SearchInput } from '../common/SearchInput';
import { RecentSearchItem } from './RecentSearchItem';
import { SearchResultItem } from './SearchResultItem';

export interface GlobalSearchHandle {
    /** Focus the search input */
    focus: () => void;
}

interface GlobalSearchProps {
    /** Additional classes for the container */
    className?: string;
    /** Optional ID for the input (useful when rendering multiple instances) */
    id?: string;
}

/**
 * Global search with fuzzy matching and recent searches
 *
 * Features:
 * - Fuzzy search using fuse.js
 * - Recent searches shown when focused with empty query
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Prices displayed alongside results
 * - Loading indicator while items are being fetched
 *
 * @example
 * ```tsx
 * const searchRef = useRef<GlobalSearchHandle>(null);
 *
 * // Focus programmatically (e.g., for Ctrl+K)
 * searchRef.current?.focus();
 *
 * <GlobalSearch ref={searchRef} className="w-80" />
 * ```
 */
export const GlobalSearch = forwardRef<GlobalSearchHandle, GlobalSearchProps>(
    ({ className = '', id = 'global-search' }, ref) => {
        const navigate = useNavigate();
        const inputRef = useRef<HTMLInputElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const listRef = useRef<HTMLUListElement>(null);

        const [query, setQuery] = useState('');
        const [isOpen, setIsOpen] = useState(false);
        const [selectedIndex, setSelectedIndex] = useState(0);

        const debouncedQuery = useDebouncedValue(query, 150);

        const { getItemsArray, getPriceById, isFullyLoaded } = useItemDataStore();
        const { recentItems, addRecentItem, removeRecentItem } = useRecentSearches();

        const items = getItemsArray();

        // Build fuse index when items change
        const fuseIndex = useMemo(() => {
            if (items.length === 0) return null;
            return createItemSearchIndex(items);
        }, [items]);

        // Search results - supports both name search and ID search
        const searchResults = useMemo(() => {
            if (!fuseIndex || !debouncedQuery.trim()) return [];
            return searchItems(fuseIndex, debouncedQuery, 12);
        }, [fuseIndex, debouncedQuery]);

        // Determine what to show
        const showRecent = isOpen && !query.trim() && recentItems.length > 0;
        const showResults = isOpen && query.trim().length > 0 && searchResults.length > 0;
        const showNoResults =
            isOpen && query.trim().length > 0 && searchResults.length === 0 && items.length > 0;
        const showDropdown = showRecent || showResults || showNoResults;

        const currentItems = showRecent ? recentItems : searchResults;
        const itemCount = currentItems.length;

        // Expose focus method to parent
        useImperativeHandle(ref, () => ({
            focus: () => inputRef.current?.focus(),
        }));

        // Reset selection only when the debounced query changes
        // This prevents resetting when just navigating with arrow keys
        useEffect(() => {
            setSelectedIndex(0);
        }, [debouncedQuery]);

        // Scroll selected item into view when navigating with keyboard
        useEffect(() => {
            if (!listRef.current || itemCount === 0) return;
            const selectedElement = listRef.current.querySelector(
                `[data-index="${selectedIndex}"]`
            ) as HTMLElement | null;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }, [selectedIndex, itemCount]);

        // Selection handler - works with both Item and RecentItem
        const selectItem = useCallback(
            (item: Item | RecentItem) => {
                // Get itemId - Item uses itemId, RecentItem also uses itemId
                const itemId = item.itemId;
                const recentEntry: RecentItem = {
                    itemId,
                    name: item.name,
                    icon: 'iconUrl' in item ? item.iconUrl : item.icon,
                };
                addRecentItem(recentEntry);
                setQuery('');
                setIsOpen(false);
                navigate(`/items/${itemId}`);
            },
            [addRecentItem, navigate]
        );

        // Use the extracted keyboard navigation hook
        const { handleKeyDown } = useSearchKeyboard({
            isOpen,
            itemCount,
            selectedIndex,
            setSelectedIndex,
            onSelect: useCallback(() => {
                if (currentItems[selectedIndex]) {
                    selectItem(currentItems[selectedIndex]);
                }
            }, [currentItems, selectedIndex, selectItem]),
            onClose: useCallback(() => setIsOpen(false), []),
            onOpen: useCallback(() => setIsOpen(true), []),
            inputRef,
        });

        const handleClose = useCallback(() => setIsOpen(false), []);

        // Loading footer when items are still being prefetched
        const loadingFooter = !isFullyLoaded ? (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                Searching {items.length.toLocaleString()} items...
            </div>
        ) : null;

        return (
            <div ref={containerRef} className={`relative ${className}`}>
                <SearchInput
                    ref={inputRef}
                    id={id}
                    name="search"
                    value={query}
                    onChange={setQuery}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search items..."
                    showShortcut
                    aria-expanded={showDropdown ? true : undefined}
                    aria-haspopup="listbox"
                />

                <Dropdown isOpen={showDropdown} onClose={handleClose} footer={loadingFooter} listRef={listRef}>
                    {/* Recent Searches */}
                    {showRecent && (
                        <>
                            <li className="px-3 py-2 bg-gray-50 dark:bg-gray-750">
                                <Text variant="muted" size="xs" weight="medium">
                                    Recent Searches
                                </Text>
                            </li>
                            {recentItems.map((item, index) => (
                                <DropdownItem
                                    key={item.itemId}
                                    isSelected={selectedIndex === index}
                                    onClick={() => selectItem(item)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    data-index={index}
                                >
                                    <RecentSearchItem item={item} onRemove={removeRecentItem} />
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
                                onClick={() => selectItem(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                data-index={index}
                            >
                                <SearchResultItem item={item} price={getPriceById(item.itemId)} />
                            </DropdownItem>
                        ))}

                    {/* No Results */}
                    {showNoResults && (
                        <li className="px-3 py-4 text-center">
                            <Text variant="muted">
                                No items found for "{query}"
                            </Text>
                        </li>
                    )}
                </Dropdown>
            </div>
        );
    }
);

GlobalSearch.displayName = 'GlobalSearch';

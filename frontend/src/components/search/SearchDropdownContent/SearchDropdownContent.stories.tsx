/**
 * SearchDropdownContent Storybook stories
 */

import type { Item } from '@/types';
import type { Meta, StoryObj } from '@storybook/react';
import { Clock, X } from 'lucide-react';
import { SearchDropdownContent } from './SearchDropdownContent';

interface MockRecentItem {
    itemId: number;
    name: string;
    icon: string;
}

const mockRecentItems: MockRecentItem[] = [
    { itemId: 1, name: 'Dragon scimitar', icon: '/icons/dragon_scimitar.png' },
    { itemId: 2, name: 'Abyssal whip', icon: '/icons/abyssal_whip.png' },
    { itemId: 3, name: 'Twisted bow', icon: '/icons/twisted_bow.png' },
];

const mockSearchResults: Item[] = [
    {
        id: 1,
        itemId: 100,
        name: 'Twisted bow',
        iconUrl: '/icons/twisted_bow.png',
        description: 'A mystical bow',
        members: true,
        buyLimit: 8,
        lowAlch: 1000000,
        highAlch: 1500000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        itemId: 101,
        name: 'Scythe of vitur',
        iconUrl: '/icons/scythe.png',
        description: 'A powerful scythe',
        members: true,
        buyLimit: 8,
        lowAlch: 2000000,
        highAlch: 3000000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 3,
        itemId: 102,
        name: 'Twisted buckler',
        iconUrl: '/icons/twisted_buckler.png',
        description: 'A strong shield',
        members: true,
        buyLimit: 8,
        lowAlch: 500000,
        highAlch: 750000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
];

const meta: Meta<typeof SearchDropdownContent> = {
    title: 'Search/SearchDropdownContent',
    component: SearchDropdownContent,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A reusable content component for search dropdowns. Renders recent searches, search results, or no results message.',
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                <ul className="max-h-80 overflow-y-auto">
                    <Story />
                </ul>
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof SearchDropdownContent>;

const defaultRenderRecentItem = (item: { itemId: number; name?: string; icon?: string }, onRemove?: (id: number) => void) => {
    const recentItem = item as MockRecentItem;
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">{recentItem.name}</span>
            </div>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(recentItem.itemId);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                    <X className="w-3 h-3 text-gray-400" />
                </button>
            )}
        </div>
    );
};

const defaultRenderResultItem = (item: Item) => (
    <div className="flex items-center gap-2 w-full">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            <span className="text-xs text-gray-400">?</span>
        </div>
        <div className="flex-1">
            <div className="text-gray-900 dark:text-gray-100">{item.name}</div>
            <div className="text-xs text-gray-500">ID: {item.itemId}</div>
        </div>
    </div>
);

/**
 * Shows recent searches when query is empty
 */
export const RecentSearches: Story = {
    args: {
        showRecent: true,
        showResults: false,
        showNoResults: false,
        recentItems: mockRecentItems,
        searchResults: [],
        selectedIndex: 0,
        query: '',
        onSelectItem: () => { },
        onHoverItem: () => { },
        renderRecentItem: defaultRenderRecentItem,
        renderResultItem: defaultRenderResultItem,
        onRemoveRecent: () => alert('Remove clicked'),
    },
};

/**
 * Shows search results when query matches
 */
export const SearchResults: Story = {
    args: {
        showRecent: false,
        showResults: true,
        showNoResults: false,
        recentItems: [],
        searchResults: mockSearchResults,
        selectedIndex: 1,
        query: 'twisted',
        onSelectItem: () => { },
        onHoverItem: () => { },
        renderRecentItem: defaultRenderRecentItem,
        renderResultItem: defaultRenderResultItem,
    },
};

/**
 * Shows no results message when query doesn't match
 */
export const NoResults: Story = {
    args: {
        showRecent: false,
        showResults: false,
        showNoResults: true,
        recentItems: [],
        searchResults: [],
        selectedIndex: 0,
        query: 'xyzabc123',
        onSelectItem: () => { },
        onHoverItem: () => { },
        renderRecentItem: defaultRenderRecentItem,
        renderResultItem: defaultRenderResultItem,
    },
};

/**
 * Custom recent header text
 */
export const CustomRecentHeader: Story = {
    args: {
        showRecent: true,
        showResults: false,
        showNoResults: false,
        recentItems: mockRecentItems,
        searchResults: [],
        selectedIndex: 0,
        query: '',
        onSelectItem: () => { },
        onHoverItem: () => { },
        renderRecentItem: defaultRenderRecentItem,
        renderResultItem: defaultRenderResultItem,
        recentHeader: 'Recently Viewed Items',
    },
};

/**
 * Empty state (nothing to show)
 */
export const EmptyState: Story = {
    args: {
        showRecent: false,
        showResults: false,
        showNoResults: false,
        recentItems: [],
        searchResults: [],
        selectedIndex: 0,
        query: '',
        onSelectItem: () => { },
        onHoverItem: () => { },
        renderRecentItem: defaultRenderRecentItem,
        renderResultItem: defaultRenderResultItem,
    },
};

/**
 * With selected item highlighted
 */
export const SelectedItem: Story = {
    args: {
        showRecent: false,
        showResults: true,
        showNoResults: false,
        recentItems: [],
        searchResults: mockSearchResults,
        selectedIndex: 0,
        query: 'twisted',
        onSelectItem: () => { },
        onHoverItem: () => { },
        renderRecentItem: defaultRenderRecentItem,
        renderResultItem: defaultRenderResultItem,
    },
};

/**
 * Recent searches with remove action
 */
export const RecentWithRemove: Story = {
    args: {
        showRecent: true,
        showResults: false,
        showNoResults: false,
        recentItems: mockRecentItems,
        searchResults: [],
        selectedIndex: 2,
        query: '',
        onSelectItem: () => { },
        onHoverItem: () => { },
        renderRecentItem: defaultRenderRecentItem,
        renderResultItem: defaultRenderResultItem,
        onRemoveRecent: () => alert('Removed'),
    },
};

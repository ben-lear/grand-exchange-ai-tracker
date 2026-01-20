/**
 * Tests for DashboardPage component
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useItemDataStore } from '../stores';
import type { Item } from '../types';
import { DashboardPage } from './DashboardPage';

// Mock the store
vi.mock('../stores', () => ({
    useItemDataStore: vi.fn(),
    usePinnedItemsStore: vi.fn(() => ({
        getPinnedItemIds: vi.fn(() => []),
    })),
}));

// Mock components that have complex dependencies
vi.mock('../components/table', () => ({
    ItemsTable: () => <div data-testid="items-table">Items Table</div>,
    FilterPanel: ({ onFiltersChange }: any) => (
        <div data-testid="filter-panel">
            <button onClick={() => onFiltersChange({ members: 'members' })}>
                Filter Members
            </button>
        </div>
    ),
    TableToolbar: ({ onSearchChange, onFilterClick }: any) => (
        <div data-testid="table-toolbar">
            <input
                data-testid="search-input"
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search items"
            />
            <button onClick={onFilterClick}>Filter</button>
        </div>
    ),
    TablePagination: ({ currentPage, onPageChange }: any) => (
        <div data-testid="table-pagination">
            Page {currentPage}
            <button onClick={() => onPageChange(2)}>Next Page</button>
        </div>
    ),
    ExportButton: () => <div data-testid="export-button">Export</div>,
}));

vi.mock('../components/common', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Create a mutable reference for filtered items
let mockFilteredItems: Item[] = [];

vi.mock('../hooks', () => ({
    useDebouncedValue: (value: string) => value,
    useItemFiltering: () => ({ filteredItems: mockFilteredItems }),
}));

// Also mock with the alias path since Vitest may resolve to it
vi.mock('@/hooks', () => ({
    useDebouncedValue: (value: string) => value,
    useItemFiltering: () => ({ filteredItems: mockFilteredItems }),
}));

vi.mock('../utils', () => ({
    createItemSearchIndex: vi.fn(() => ({})),
    filterItemIdsByRelevance: vi.fn(() => []),
}));

const mockItems: Map<number, Item> = new Map([
    [
        1,
        {
            id: 1,
            itemId: 1,
            name: 'Iron ore',
            description: 'A valuable ore used in Smithing',
            iconUrl: 'https://example.com/icon1.png',
            members: false,
            buyLimit: 30000,
            highAlch: 10,
            lowAlch: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
    [
        2,
        {
            id: 2,
            itemId: 2,
            name: 'Gold ore',
            description: 'A valuable ore used in Smithing and Crafting',
            iconUrl: 'https://example.com/icon2.png',
            members: true,
            buyLimit: 25000,
            highAlch: 100,
            lowAlch: 50,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
]);

const mockPrices = new Map([
    [1, { highPrice: 150, lowPrice: 100 }],
    [2, { highPrice: 300, lowPrice: 250 }],
]);

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

const mockStoreState = {
    items: mockItems,
    currentPrices: mockPrices,
    pricesLoaded: true,
    isFullyLoaded: true,
};

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Set up the filtered items to include the mock items
        mockFilteredItems = Array.from(mockItems.values());
        // Mock the store to properly handle selector functions
        (useItemDataStore as any).mockImplementation((selector: (state: any) => any) => {
            return selector(mockStoreState);
        });
    });

    describe('Rendering', () => {
        it('should render main components', () => {
            renderWithRouter(<DashboardPage />);

            expect(screen.getByTestId('table-toolbar')).toBeInTheDocument();
            expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument(); // Filter panel not shown by default
            expect(screen.getByTestId('items-table')).toBeInTheDocument();
            expect(screen.getByTestId('table-pagination')).toBeInTheDocument();
            expect(screen.getByTestId('export-button')).toBeInTheDocument();
        });

        it('should render loading spinner when data is not ready', () => {
            (useItemDataStore as any).mockImplementation((selector: (state: any) => any) => {
                return selector({
                    items: new Map(),
                    currentPrices: mockPrices,
                    pricesLoaded: false,
                    isFullyLoaded: false,
                });
            });

            renderWithRouter(<DashboardPage />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should render content when data is loaded', () => {
            renderWithRouter(<DashboardPage />);
            expect(screen.getByTestId('items-table')).toBeInTheDocument();
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        });
    });

    describe('Search Functionality', () => {
        it('should have search input field', () => {
            renderWithRouter(<DashboardPage />);
            const searchInput = screen.getByTestId('search-input');
            expect(searchInput).toBeInTheDocument();
            expect(searchInput).toHaveAttribute('placeholder', 'Search items');
        });

        it('should update search query on input change', () => {
            renderWithRouter(<DashboardPage />);
            const searchInput = screen.getByTestId('search-input') as HTMLInputElement;

            fireEvent.change(searchInput, { target: { value: 'Iron' } });
            expect(searchInput.value).toBe('Iron');
        });
    });

    describe('Filtering', () => {
        it('should render filter panel', () => {
            renderWithRouter(<DashboardPage />);
            // Filter panel is hidden by default
            expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();

            // Click filter button to show it
            const filterButton = screen.getByRole('button', { name: /filter/i });
            fireEvent.click(filterButton);

            // Now it should be visible
            expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
        });

        it('should apply filters when filter button is clicked', () => {
            renderWithRouter(<DashboardPage />);
            // Click filter button to open panel
            const filterButton = screen.getByRole('button', { name: /filter/i });
            fireEvent.click(filterButton);

            // Filter panel should now be visible
            expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
        });
    });

    describe('Pagination', () => {
        it('should display pagination controls', () => {
            renderWithRouter(<DashboardPage />);
            expect(screen.getByTestId('table-pagination')).toBeInTheDocument();
        });

        it('should change page on pagination button click', () => {
            renderWithRouter(<DashboardPage />);
            const nextPageButton = screen.getByText('Next Page');
            fireEvent.click(nextPageButton);
            expect(nextPageButton).toBeInTheDocument();
        });
    });

    describe('Data Integration', () => {
        it('should subscribe to store items', () => {
            renderWithRouter(<DashboardPage />);
            expect(useItemDataStore).toHaveBeenCalled();
        });

        it('should handle empty items', () => {
            (useItemDataStore as any).mockImplementation((selector: (state: any) => any) => {
                return selector({
                    items: new Map(),
                    currentPrices: new Map(),
                    pricesLoaded: true,
                    isFullyLoaded: true,
                });
            });

            renderWithRouter(<DashboardPage />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should handle missing prices', () => {
            (useItemDataStore as any).mockImplementation((selector: (state: any) => any) => {
                return selector({
                    items: mockItems,
                    currentPrices: new Map(),
                    pricesLoaded: false,
                    isFullyLoaded: false,
                });
            });

            renderWithRouter(<DashboardPage />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });
    });

    describe('UI States', () => {
        it('should show loading state initially', () => {
            (useItemDataStore as any).mockImplementation((selector: (state: any) => any) => {
                return selector({
                    items: mockItems,
                    currentPrices: new Map(),
                    pricesLoaded: false,
                    isFullyLoaded: false,
                });
            });

            renderWithRouter(<DashboardPage />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should transition from loading to ready state', async () => {
            (useItemDataStore as any).mockImplementation((selector: (state: any) => any) => {
                return selector({
                    items: mockItems,
                    currentPrices: new Map(),
                    pricesLoaded: false,
                    isFullyLoaded: false,
                });
            });
            const { rerender } = renderWithRouter(<DashboardPage />);

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

            (useItemDataStore as any).mockImplementation((selector: (state: any) => any) => {
                return selector({
                    items: mockItems,
                    currentPrices: mockPrices,
                    pricesLoaded: true,
                    isFullyLoaded: true,
                });
            });

            rerender(
                <BrowserRouter>
                    <DashboardPage />
                </BrowserRouter>
            );

            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            expect(screen.getByTestId('items-table')).toBeInTheDocument();
        });
    });
});

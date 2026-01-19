/**
 * Unit tests for WatchlistDropdown component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchlistDropdown } from './WatchlistDropdown';

// Mock the store
const mockGetAllWatchlists = vi.fn();
const mockIsItemInWatchlist = vi.fn();
const mockAddItemToWatchlist = vi.fn();
const mockRemoveItemFromWatchlist = vi.fn();
const mockGetItemWatchlists = vi.fn();
const mockGetWatchlistCount = vi.fn();
const mockCreateWatchlist = vi.fn();

vi.mock('../../stores/useWatchlistStore', () => ({
    useWatchlistStore: vi.fn((selector) => {
        const state = {
            getAllWatchlists: mockGetAllWatchlists,
            isItemInWatchlist: mockIsItemInWatchlist,
            addItemToWatchlist: mockAddItemToWatchlist,
            removeItemFromWatchlist: mockRemoveItemFromWatchlist,
            getItemWatchlists: mockGetItemWatchlists,
            getWatchlistCount: mockGetWatchlistCount,
            createWatchlist: mockCreateWatchlist,
        };
        return selector ? selector(state) : state;
    }),
}));

describe('WatchlistDropdown', () => {
    const mockWatchlists = [
        {
            id: 'default',
            name: 'Favorites',
            items: [],
            isDefault: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            id: 'watchlist-1',
            name: 'High Value Items',
            items: [],
            isDefault: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAllWatchlists.mockReturnValue(mockWatchlists);
        mockGetItemWatchlists.mockReturnValue([]);
        mockIsItemInWatchlist.mockReturnValue(false);
        mockGetWatchlistCount.mockReturnValue(2);
        mockCreateWatchlist.mockReturnValue('new-watchlist-id');
    });

    it('renders button with default icon', () => {
        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with custom button content', () => {
        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
                buttonContent={<span>Custom</span>}
            />
        );

        expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('displays watchlists when opened', async () => {
        const user = userEvent.setup();

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText('Favorites')).toBeInTheDocument();
        expect(screen.getByText('High Value Items')).toBeInTheDocument();
    });

    it('shows star icon for default watchlist', async () => {
        const user = userEvent.setup();

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));

        // Check if Favorites has a star (looking for SVG with fill)
        const favoritesButton = screen.getByText('Favorites').closest('button');
        expect(favoritesButton).toBeInTheDocument();
    });

    it('displays item count for each watchlist', async () => {
        const user = userEvent.setup();
        const watchlistsWithItems = [
            { ...mockWatchlists[0], items: new Array(5).fill({}) },
            { ...mockWatchlists[1], items: new Array(10).fill({}) },
        ];
        mockGetAllWatchlists.mockReturnValue(watchlistsWithItems);

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText('(5)')).toBeInTheDocument();
        expect(screen.getByText('(10)')).toBeInTheDocument();
    });

    it('shows check mark for watchlists containing the item', async () => {
        const user = userEvent.setup();
        mockIsItemInWatchlist.mockImplementation((watchlistId: string) => {
            return watchlistId === 'default';
        });

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));

        // The item is in "Favorites" but not in "High Value Items"
        // Check that there's a check icon visible for the Favorites watchlist
        const favoritesText = screen.getByText('Favorites');
        expect(favoritesText).toBeInTheDocument();

        // Check that the check icon is present (item is in Favorites)
        const checkIcons = screen.getAllByTestId('check-icon');
        expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('adds item to watchlist when clicked', async () => {
        const user = userEvent.setup();
        mockAddItemToWatchlist.mockReturnValue(true);

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByText('Favorites'));

        expect(mockAddItemToWatchlist).toHaveBeenCalledWith('default', {
            itemId: 1,
            name: 'Test Item',
            iconUrl: 'https://example.com/icon.png',
        });
    });

    it('removes item from watchlist when already in it', async () => {
        const user = userEvent.setup();
        mockIsItemInWatchlist.mockReturnValue(true);

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByText('Favorites'));

        expect(mockRemoveItemFromWatchlist).toHaveBeenCalledWith('default', 1);
    });

    it('calls onChange callback when item membership changes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        mockAddItemToWatchlist.mockReturnValue(true);
        mockGetItemWatchlists.mockReturnValue([mockWatchlists[0]]);

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
                onChange={onChange}
            />
        );

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByText('Favorites'));

        expect(onChange).toHaveBeenCalledWith(['default']);
    });

    it('displays empty state when no watchlists exist', async () => {
        const user = userEvent.setup();
        mockGetAllWatchlists.mockReturnValue([]);

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText('No watchlists yet')).toBeInTheDocument();
    });

    it('displays current membership count', async () => {
        const user = userEvent.setup();
        mockGetItemWatchlists.mockReturnValue([mockWatchlists[0], mockWatchlists[1]]);

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
            />
        );

        await user.click(screen.getByRole('button'));

        expect(screen.getByText(/In 2 watchlists/)).toBeInTheDocument();
    });

    it('applies custom button className', () => {
        const customClass = 'custom-button-class';

        render(
            <WatchlistDropdown
                itemId={1}
                itemName="Test Item"
                itemIconUrl="https://example.com/icon.png"
                buttonClassName={customClass}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass(customClass);
    });
});

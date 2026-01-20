import type { Item } from '@/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WatchlistCell } from './WatchlistCell';

// Mock the WatchlistDropdown component
vi.mock('@/components/common/WatchlistDropdown', () => ({
    WatchlistDropdown: ({ itemName }: { itemName: string }) => (
        <div data-testid="watchlist-dropdown">Dropdown for {itemName}</div>
    ),
}));

// Mock the store
vi.mock('@/stores', () => ({
    useWatchlistStore: vi.fn(() => ({
        getItemWatchlists: vi.fn((itemId: number) => {
            if (itemId === 1) {
                return [
                    { id: 'favorites', name: 'Favorites', isDefault: true },
                    { id: 'custom1', name: 'Custom Watchlist 1', isDefault: false },
                    { id: 'custom2', name: 'Custom Watchlist 2', isDefault: false },
                ];
            }
            return [{ id: 'favorites', name: 'Favorites', isDefault: true }];
        }),
    })),
}));

const mockItem: Item = {
    id: 1,
    itemId: 1,
    name: 'Test Item',
    description: 'Test Description',
    iconUrl: 'https://example.com/icon.png',
    members: false,
    buyLimit: 10000,
    highAlch: 1000,
    lowAlch: 500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

describe('WatchlistCell', () => {
    it('should render watchlist dropdown', () => {
        render(<WatchlistCell item={mockItem} />);
        expect(screen.getByTestId('watchlist-dropdown')).toBeInTheDocument();
    });

    it('should display watchlist names when item is in custom watchlists', () => {
        render(<WatchlistCell item={mockItem} />);
        expect(screen.getByText('Custom Watchlist 1, Custom Watchlist 2')).toBeInTheDocument();
    });

    it('should not display default favorites watchlist', () => {
        render(<WatchlistCell item={mockItem} />);
        expect(screen.queryByText(/favorites/i)).not.toBeInTheDocument();
    });

    it('should show truncated text for more than 2 watchlists', async () => {
        const { useWatchlistStore } = await import('@/stores');
        vi.mocked(useWatchlistStore).mockReturnValue({
            getItemWatchlists: vi.fn(() => [
                { id: 'custom1', name: 'Watchlist 1', isDefault: false },
                { id: 'custom2', name: 'Watchlist 2', isDefault: false },
                { id: 'custom3', name: 'Watchlist 3', isDefault: false },
            ]),
        } as any);

        render(<WatchlistCell item={mockItem} />);
        expect(screen.getByText(/Watchlist 1, Watchlist 2, \+1 more/)).toBeInTheDocument();
    });

    it('should not display watchlist names if only in favorites', () => {
        const itemNotInCustom = { ...mockItem, itemId: 2 };
        render(<WatchlistCell item={itemNotInCustom} />);
        expect(screen.queryByText(/custom watchlist/i)).not.toBeInTheDocument();
    });

    it('should have tooltip with all watchlist names', async () => {
        const { useWatchlistStore } = await import('@/stores');
        vi.mocked(useWatchlistStore).mockReturnValue({
            getItemWatchlists: vi.fn(() => [
                { id: 'custom1', name: 'WL1', isDefault: false },
                { id: 'custom2', name: 'WL2', isDefault: false },
                { id: 'custom3', name: 'WL3', isDefault: false },
            ]),
        } as any);

        render(<WatchlistCell item={mockItem} />);
        const text = screen.getByText(/WL1, WL2, \+1 more/);
        expect(text).toHaveAttribute('title', 'WL1, WL2, WL3');
    });
});

import type { Item } from '@/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FavoriteCell } from './FavoriteCell';

// Mock the store
vi.mock('@/stores', () => ({
    useWatchlistStore: vi.fn(() => ({
        isItemInWatchlist: vi.fn((_watchlistId: string, itemId: number) => itemId === 1),
        addItemToWatchlist: vi.fn(),
        removeItemFromWatchlist: vi.fn(),
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

describe('FavoriteCell', () => {
    it('should render favorite button', () => {
        render(<FavoriteCell item={mockItem} />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('should show favorited state for favorited items', () => {
        render(<FavoriteCell item={mockItem} />);
        const button = screen.getByRole('button', { name: /remove from favorites/i });
        expect(button).toBeInTheDocument();
    });

    it('should show unfavorited state for non-favorited items', () => {
        const nonFavoriteItem = { ...mockItem, itemId: 2 };
        render(<FavoriteCell item={nonFavoriteItem} />);
        const button = screen.getByRole('button', { name: /add to favorites/i });
        expect(button).toBeInTheDocument();
    });

    it('should add item to favorites when clicked on unfavorited item', async () => {
        const { useWatchlistStore } = await import('@/stores');
        const addItemToWatchlist = vi.fn();
        vi.mocked(useWatchlistStore).mockReturnValue({
            isItemInWatchlist: vi.fn(() => false),
            addItemToWatchlist,
            removeItemFromWatchlist: vi.fn(),
            watchlists: [],
            getItemWatchlists: vi.fn(() => []),
        } as any);

        const user = userEvent.setup();
        render(<FavoriteCell item={mockItem} />);

        const button = screen.getByRole('button');
        await user.click(button);

        expect(addItemToWatchlist).toHaveBeenCalledWith('default-favorites', {
            itemId: 1,
            name: 'Test Item',
            iconUrl: 'https://example.com/icon.png',
        });
    });

    it('should remove item from favorites when clicked on favorited item', async () => {
        const { useWatchlistStore } = await import('@/stores');
        const removeItemFromWatchlist = vi.fn();
        vi.mocked(useWatchlistStore).mockReturnValue({
            isItemInWatchlist: vi.fn(() => true),
            addItemToWatchlist: vi.fn(),
            removeItemFromWatchlist,
            watchlists: [],
            getItemWatchlists: vi.fn(() => []),
        } as any);

        const user = userEvent.setup();
        render(<FavoriteCell item={mockItem} />);

        const button = screen.getByRole('button');
        await user.click(button);

        expect(removeItemFromWatchlist).toHaveBeenCalledWith('default-favorites', 1);
    });

    it('should apply correct styling for favorited state', () => {
        render(<FavoriteCell item={mockItem} />);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should apply correct styling for unfavorited state', async () => {
        const { useWatchlistStore } = await import('@/stores');
        vi.mocked(useWatchlistStore).mockReturnValue({
            isItemInWatchlist: vi.fn(() => false),
            addItemToWatchlist: vi.fn(),
            removeItemFromWatchlist: vi.fn(),
            watchlists: [],
            getItemWatchlists: vi.fn(() => []),
        } as any);

        const nonFavoriteItem = { ...mockItem, itemId: 2 };
        render(<FavoriteCell item={nonFavoriteItem} />);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-pressed', 'false');
    });
});

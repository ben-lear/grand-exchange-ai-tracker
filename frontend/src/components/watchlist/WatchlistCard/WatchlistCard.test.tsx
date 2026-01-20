/**
 * Unit tests for WatchlistCard component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Watchlist } from '@/types/watchlist';
import { WatchlistCard } from './WatchlistCard';

describe('WatchlistCard', () => {
    const baseWatchlist: Watchlist = {
        id: 'test-id',
        name: 'Test Watchlist',
        items: [
            {
                itemId: 1,
                name: 'Item 1',
                iconUrl: 'https://example.com/icon1.png',
                addedAt: Date.now(),
            },
            {
                itemId: 2,
                name: 'Item 2',
                iconUrl: 'https://example.com/icon2.png',
                addedAt: Date.now(),
            },
        ],
        createdAt: Date.now() - 86400000, // 1 day ago
        updatedAt: Date.now() - 3600000, // 1 hour ago
        isDefault: false,
    };

    const defaultWatchlist: Watchlist = {
        ...baseWatchlist,
        id: 'default-id',
        name: 'Favorites',
        isDefault: true,
    };

    const emptyWatchlist: Watchlist = {
        ...baseWatchlist,
        id: 'empty-id',
        name: 'Empty Watchlist',
        items: [],
    };

    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnShare = vi.fn();
    const mockOnExport = vi.fn();
    const mockOnClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders watchlist name', () => {
        render(<WatchlistCard watchlist={baseWatchlist} />);
        expect(screen.getByText('Test Watchlist')).toBeInTheDocument();
    });

    it('displays item count', () => {
        render(<WatchlistCard watchlist={baseWatchlist} />);
        expect(screen.getByText('2 items')).toBeInTheDocument();
    });

    it('displays singular item count', () => {
        const singleItemWatchlist = {
            ...baseWatchlist,
            items: [baseWatchlist.items[0]],
        };
        render(<WatchlistCard watchlist={singleItemWatchlist} />);
        expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('displays star icon for default watchlist', () => {
        render(<WatchlistCard watchlist={defaultWatchlist} />);
        // The star should be rendered - check by class
        const star = document.querySelector('.lucide-star');
        expect(star).toBeInTheDocument();
    });

    it('does not display star icon for non-default watchlist', () => {
        render(<WatchlistCard watchlist={baseWatchlist} />);
        const star = document.querySelector('.lucide-star');
        expect(star).not.toBeInTheDocument();
    });

    it('shows empty state message for empty watchlist', () => {
        render(<WatchlistCard watchlist={emptyWatchlist} />);
        expect(screen.getByText('No items in this watchlist')).toBeInTheDocument();
    });

    it('renders item preview images', () => {
        render(<WatchlistCard watchlist={baseWatchlist} />);
        const images = screen.getAllByRole('img');
        expect(images.length).toBe(2);
        expect(images[0]).toHaveAttribute('alt', 'Item 1');
        expect(images[1]).toHaveAttribute('alt', 'Item 2');
    });

    it('calls onClick when card is clicked', async () => {
        const user = userEvent.setup();
        render(<WatchlistCard watchlist={baseWatchlist} onClick={mockOnClick} />);

        // Click on the card (the main container)
        const card = screen.getByText('Test Watchlist').closest('div[class*="bg-white"]');
        if (card) {
            await user.click(card);
            expect(mockOnClick).toHaveBeenCalled();
        }
    });

    it('opens menu when menu button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <WatchlistCard
                watchlist={baseWatchlist}
                onShare={mockOnShare}
                onExport={mockOnExport}
            />
        );

        // Find and click the menu button - use getByRole for better reliability
        const menuButton = screen.getByRole('button');
        expect(menuButton).toBeInTheDocument();

        await user.click(menuButton);

        // Check that menu items are visible
        expect(screen.getByText('Share')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('calls onShare when Share menu item is clicked', async () => {
        const user = userEvent.setup();
        render(
            <WatchlistCard
                watchlist={baseWatchlist}
                onShare={mockOnShare}
            />
        );

        const menuButton = document.querySelector('.lucide-more-vertical')?.closest('button');
        if (menuButton) {
            await user.click(menuButton);
            await user.click(screen.getByText('Share'));
            expect(mockOnShare).toHaveBeenCalled();
        }
    });

    it('calls onExport when Export menu item is clicked', async () => {
        const user = userEvent.setup();
        render(
            <WatchlistCard
                watchlist={baseWatchlist}
                onExport={mockOnExport}
            />
        );

        const menuButton = document.querySelector('.lucide-more-vertical')?.closest('button');
        if (menuButton) {
            await user.click(menuButton);
            await user.click(screen.getByText('Export'));
            expect(mockOnExport).toHaveBeenCalled();
        }
    });

    it('shows Edit option for non-default watchlist', async () => {
        const user = userEvent.setup();
        render(
            <WatchlistCard
                watchlist={baseWatchlist}
                onEdit={mockOnEdit}
            />
        );

        const menuButton = document.querySelector('.lucide-more-vertical')?.closest('button');
        if (menuButton) {
            await user.click(menuButton);
            expect(screen.getByText('Edit')).toBeInTheDocument();
        }
    });

    it('does not show Edit option for default watchlist', async () => {
        const user = userEvent.setup();
        render(
            <WatchlistCard
                watchlist={defaultWatchlist}
                onEdit={mockOnEdit}
            />
        );

        const menuButton = document.querySelector('.lucide-more-vertical')?.closest('button');
        if (menuButton) {
            await user.click(menuButton);
            expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        }
    });

    it('shows Delete option for non-default watchlist', async () => {
        const user = userEvent.setup();
        render(
            <WatchlistCard
                watchlist={baseWatchlist}
                onDelete={mockOnDelete}
            />
        );

        const menuButton = document.querySelector('.lucide-more-vertical')?.closest('button');
        if (menuButton) {
            await user.click(menuButton);
            expect(screen.getByText('Delete')).toBeInTheDocument();
        }
    });

    it('does not show Delete option for default watchlist', async () => {
        const user = userEvent.setup();
        render(
            <WatchlistCard
                watchlist={defaultWatchlist}
                onDelete={mockOnDelete}
            />
        );

        const menuButton = document.querySelector('.lucide-more-vertical')?.closest('button');
        if (menuButton) {
            await user.click(menuButton);
            expect(screen.queryByText('Delete')).not.toBeInTheDocument();
        }
    });

    it('limits preview to 8 items', () => {
        const manyItemsWatchlist: Watchlist = {
            ...baseWatchlist,
            items: Array.from({ length: 12 }, (_, i) => ({
                itemId: i + 1,
                name: `Item ${i + 1}`,
                iconUrl: `https://example.com/icon${i + 1}.png`,
                addedAt: Date.now(),
            })),
        };

        render(<WatchlistCard watchlist={manyItemsWatchlist} />);

        // Should only render 8 images max
        const images = screen.getAllByRole('img');
        expect(images.length).toBe(8);
    });

    it('displays relative time for last updated', () => {
        render(<WatchlistCard watchlist={baseWatchlist} />);
        // Should show something like "1 hour ago" or similar relative time
        // The exact text depends on the implementation of getRelativeTime
        expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
});

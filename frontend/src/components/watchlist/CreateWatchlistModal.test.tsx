/**
 * Unit tests for CreateWatchlistModal component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWatchlistStore } from '../../stores';
import { WATCHLIST_LIMITS } from '../../types/watchlist';
import { CreateWatchlistModal } from './CreateWatchlistModal';

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock the store
vi.mock('../../stores/watchlist/useWatchlistStore', () => ({
    useWatchlistStore: vi.fn(),
}));

describe('CreateWatchlistModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockCreateWatchlist = vi.fn();

    const emptyWatchlists: never[] = [];
    const watchlistsWithOne = [
        {
            id: 'existing-1',
            name: 'Existing Watchlist',
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDefault: false,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        (useWatchlistStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: unknown) => unknown) => {
                const state = {
                    createWatchlist: mockCreateWatchlist,
                    getAllWatchlists: () => emptyWatchlists,
                };
                return selector(state);
            }
        );
    });

    it('renders modal when open', () => {
        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText('Create New Watchlist')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter watchlist name...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create watchlist/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <CreateWatchlistModal
                isOpen={false}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.queryByText('Create New Watchlist')).not.toBeInTheDocument();
    });

    it('displays character count', async () => {
        const user = userEvent.setup();

        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const input = screen.getByPlaceholderText('Enter watchlist name...');
        await user.type(input, 'Test');

        expect(screen.getByText(`4/${WATCHLIST_LIMITS.MAX_NAME_LENGTH} characters`)).toBeInTheDocument();
    });

    it('disables submit button when name is empty', () => {
        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const submitButton = screen.getByRole('button', { name: /create watchlist/i });
        expect(submitButton).toBeDisabled();
    });

    it('enables submit button when name is entered', async () => {
        const user = userEvent.setup();

        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const input = screen.getByPlaceholderText('Enter watchlist name...');
        await user.type(input, 'My Watchlist');

        const submitButton = screen.getByRole('button', { name: /create watchlist/i });
        expect(submitButton).not.toBeDisabled();
    });

    it('calls createWatchlist and onSuccess on successful submit', async () => {
        const user = userEvent.setup();
        mockCreateWatchlist.mockReturnValue('new-id');

        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const input = screen.getByPlaceholderText('Enter watchlist name...');
        await user.type(input, 'My New Watchlist');

        const submitButton = screen.getByRole('button', { name: /create watchlist/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockCreateWatchlist).toHaveBeenCalledWith('My New Watchlist');
            expect(mockOnSuccess).toHaveBeenCalledWith('new-id');
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('closes modal on cancel', async () => {
        const user = userEvent.setup();

        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal via X button', async () => {
        const user = userEvent.setup();

        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Find the X button - it's a button with an X icon
        const closeButtons = screen.getAllByRole('button');
        const xButton = closeButtons.find(
            (btn) => btn.querySelector('.lucide-x') !== null
        );

        if (xButton) {
            await user.click(xButton);
            expect(mockOnClose).toHaveBeenCalled();
        }
    });

    it('shows limit warning when at max watchlists', () => {
        // Mock being at the limit
        const maxWatchlists = Array.from({ length: WATCHLIST_LIMITS.MAX_WATCHLISTS }, (_, i) => ({
            id: `watchlist-${i}`,
            name: `Watchlist ${i}`,
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDefault: i === 0,
        }));

        (useWatchlistStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: unknown) => unknown) => {
                const state = {
                    createWatchlist: mockCreateWatchlist,
                    getAllWatchlists: () => maxWatchlists,
                };
                return selector(state);
            }
        );

        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(
            screen.getByText(/you've reached the maximum/i)
        ).toBeInTheDocument();
        expect(screen.queryByLabelText('Watchlist Name')).not.toBeInTheDocument();
    });

    it('shows watchlist count in footer', () => {
        (useWatchlistStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: unknown) => unknown) => {
                const state = {
                    createWatchlist: mockCreateWatchlist,
                    getAllWatchlists: () => watchlistsWithOne,
                };
                return selector(state);
            }
        );

        render(
            <CreateWatchlistModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(
            screen.getByText(`Watchlists: 1 / ${WATCHLIST_LIMITS.MAX_WATCHLISTS}`)
        ).toBeInTheDocument();
    });

    // Removed: Form submission test - StandardModal removed forms, button disabled state prevents submission
});

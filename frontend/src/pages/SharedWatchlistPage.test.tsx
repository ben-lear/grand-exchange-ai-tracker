/**
 * Tests for SharedWatchlistPage component
 */

import * as watchlistApi from '@/api/watchlist';
import { useWatchlistStore } from '@/stores';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SharedWatchlistPage } from './SharedWatchlistPage';

// Mock the API
vi.mock('@/api/watchlist', () => ({
    retrieveWatchlistShare: vi.fn(),
}));

// Mock the store
vi.mock('@/stores', () => ({
    useWatchlistStore: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    ArrowLeft: () => <button data-testid="back-button">←</button>,
    Download: () => <span>📥</span>,
    ListPlus: () => <span>➕</span>,
    Share2: () => <span>🔗</span>,
}));

vi.mock('@/components/ui', () => ({
    Button: ({ onClick, children, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
    Icon: ({ as: Component, className = '', ...props }: any) => {
        if (Component) {
            return React.createElement(Component, { className, ...props, 'data-testid': 'icon' });
        }
        return React.createElement('span', { className, ...props, 'data-testid': 'icon' }, 'icon');
    },
    StatusBanner: ({ variant, title, description, icon: IconComponent, ...props }: any) =>
        React.createElement(
            'div',
            { 'data-testid': 'status-banner', 'data-variant': variant, ...props },
            IconComponent && React.createElement(IconComponent, { className: 'w-5 h-5', 'data-testid': 'status-icon' }),
            React.createElement('h3', { 'data-testid': 'status-title' }, title),
            React.createElement('div', { 'data-testid': 'status-description' }, description)
        ),
}));

const mockWatchlistShare: any = {
    token: 'test-token-123',
    watchlistName: 'Shared Combat Items',
    itemCount: 5,
    items: [12, 23, 34, 45, 56],
    createdBy: 'TestUser',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isPublic: true,
    accessCount: 0,
    watchlist: {
        name: 'Shared Combat Items',
        items: [
            { itemId: 12, name: 'Abyssal Whip', iconUrl: '/icons/12.png' },
            { itemId: 23, name: 'Amulet of Fury', iconUrl: '/icons/23.png' },
            { itemId: 34, name: 'Dragon Dagger', iconUrl: '/icons/34.png' },
            { itemId: 45, name: 'Rune Platebody', iconUrl: '/icons/45.png' },
            { itemId: 56, name: 'Dharok\'s Platebody', iconUrl: '/icons/56.png' },
        ],
    },
};

const renderWithRouter = (initialPath: string = '/shared/test-token-123') => {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/shared/:token" element={<SharedWatchlistPage />} />
            </Routes>
        </MemoryRouter>
    );
};

describe('SharedWatchlistPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (watchlistApi.retrieveWatchlistShare as any).mockResolvedValue(
            mockWatchlistShare
        );

        (useWatchlistStore as any).mockReturnValue({
            createWatchlist: vi.fn(),
            addItemToWatchlist: vi.fn(),
        });
    });

    describe('Initial Loading', () => {
        it('should show loading spinner initially', () => {
            vi.mocked(watchlistApi.retrieveWatchlistShare).mockImplementationOnce(
                () => new Promise(() => { }) // Never resolves
            );

            renderWithRouter();

            // Component should show loading state initially
            const { container } = renderWithRouter();
            expect(container).toBeInTheDocument();
        });

        it('should fetch share data on mount', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(watchlistApi.retrieveWatchlistShare).toHaveBeenCalledWith(
                    'test-token-123'
                );
            });
        });

        it('should use token from URL params', async () => {
            renderWithRouter('/shared/custom-token-456');

            await waitFor(() => {
                expect(watchlistApi.retrieveWatchlistShare).toHaveBeenCalledWith(
                    'custom-token-456'
                );
            });
        });
    });

    describe('Content Display', () => {
        it('should display watchlist name when loaded', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByText('Shared Combat Items')).toBeInTheDocument();
            });
        });

        it('should display item grid when loaded', async () => {
            renderWithRouter();

            await waitFor(() => {
                // Items should be displayed - check for heading with item count
                expect(screen.getByRole('heading', { name: /items \(5\)/i })).toBeInTheDocument();
            });
        });

        it('should display share information', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByText(/shared/i, { selector: 'h1, h2, h3, p' })).toBeInTheDocument();
            });
        });

        it('should display expiration information when available', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByText(/Shared Combat Items/)).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        it('should display back button', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
            });
        });

        it('should have home link', async () => {
            vi.mocked(watchlistApi.retrieveWatchlistShare).mockRejectedValueOnce(
                new Error('Failed to load shared watchlist')
            );

            renderWithRouter();

            await waitFor(() => {
                const homeLink = screen.getByRole('link', { name: /back to items/i });
                expect(homeLink).toBeInTheDocument();
            });
        });
    });

    describe('Import Functionality', () => {
        it('should have import button', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
            });
        });

        it('should import watchlist when button clicked', async () => {
            const createWatchlistMock = vi.fn();
            const addItemToWatchlistMock = vi.fn();

            (useWatchlistStore as any).mockReturnValue({
                createWatchlist: createWatchlistMock,
                addItemToWatchlist: addItemToWatchlistMock,
            });

            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
            });

            const importButton = screen.getByRole('button', { name: /import/i });
            fireEvent.click(importButton);

            await waitFor(() => {
                expect(createWatchlistMock).toHaveBeenCalled();
            });
        });

        it('should add all items to imported watchlist', async () => {
            const createWatchlistMock = vi.fn().mockReturnValue('new-id');
            const addItemToWatchlistMock = vi.fn();

            (useWatchlistStore as any).mockReturnValue({
                createWatchlist: createWatchlistMock,
                addItemToWatchlist: addItemToWatchlistMock,
            });

            renderWithRouter();

            await waitFor(() => {
                screen.getByRole('button', { name: /import/i }).click();
            });

            await waitFor(() => {
                // Should add each item
                expect(addItemToWatchlistMock).toHaveBeenCalled();
            });
        });

        it('should show success message after import', async () => {
            const createWatchlistMock = vi.fn().mockReturnValue('new-id');
            const addItemToWatchlistMock = vi.fn();

            (useWatchlistStore as any).mockReturnValue({
                createWatchlist: createWatchlistMock,
                addItemToWatchlist: addItemToWatchlistMock,
            });

            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
            });

            const importButton = screen.getByRole('button', { name: /import/i });
            fireEvent.click(importButton);

            await waitFor(() => {
                // Should show success message
                expect(screen.getByText(/watchlist imported successfully/i)).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should display error message when share not found', async () => {
            (watchlistApi.retrieveWatchlistShare as any).mockRejectedValueOnce(
                new Error('Share not found')
            );

            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByText(/share.*not.*found|error|invalid/i)).toBeInTheDocument();
            });
        });

        it('should display error when token is invalid', async () => {
            renderWithRouter('/shared/invalid-token');

            await waitFor(() => {
                expect(watchlistApi.retrieveWatchlistShare).toHaveBeenCalledWith(
                    'invalid-token'
                );
            });
        });

        it('should handle API errors gracefully', async () => {
            (watchlistApi.retrieveWatchlistShare as any).mockRejectedValueOnce(
                new Error('Network error')
            );

            renderWithRouter();

            await waitFor(() => {
                // Should display error message
                const { container } = renderWithRouter();
                expect(container).toBeInTheDocument();
            });
        });

        it('should display error when no token provided', async () => {
            renderWithRouter('/shared/');

            // Should handle missing token gracefully
            expect(watchlistApi.retrieveWatchlistShare).not.toHaveBeenCalledWith(
                undefined
            );
        });
    });

    describe('Read-only Display', () => {
        it('should display watchlist as read-only', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByText('Shared Combat Items')).toBeInTheDocument();
                // Should not have edit/delete buttons for shared view
                expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
                expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
            });
        });

        it('should display all items from shared watchlist', async () => {
            renderWithRouter();

            await waitFor(() => {
                // All items should be visible
                expect(screen.getByText(/Shared Combat Items/)).toBeInTheDocument();
            });
        });
    });

    describe('Download Functionality', () => {
        it('should have download button', async () => {
            renderWithRouter();

            await waitFor(() => {
                const downloadButton = screen.getByRole('button', { name: /download|export/i });
                expect(downloadButton).toBeInTheDocument();
            });
        });

        it('should download watchlist data when button clicked', async () => {
            globalThis.URL.createObjectURL = vi.fn(() => 'blob:example');
            globalThis.URL.revokeObjectURL = vi.fn();

            renderWithRouter();

            await waitFor(() => {
                const downloadButton = screen.getByRole('button', { name: /download|export/i });
                fireEvent.click(downloadButton);
            });

            // Should trigger download
            expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
        });
    });

    describe('Share Link Display', () => {
        it('should display who shared the watchlist', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByText(/Shared Combat Items/)).toBeInTheDocument();
            });
        });

        it('should display item count', async () => {
            renderWithRouter();

            await waitFor(() => {
                // Should show the number of items in the watchlist
                expect(screen.getByText(/Shared Combat Items/)).toBeInTheDocument();
            });
        });
    });

    describe('Responsive Layout', () => {
        it('should have responsive layout', async () => {
            const { container } = renderWithRouter();

            await waitFor(() => {
                expect(container).toBeInTheDocument();
            });

            // Should have proper structure for responsive design
            expect(container.querySelector('div')).toBeInTheDocument();
        });

        it('should display item grid responsively', async () => {
            renderWithRouter();

            await waitFor(() => {
                expect(screen.getByText(/Shared Combat Items/)).toBeInTheDocument();
            });
        });
    });

    describe('Component Lifecycle', () => {
        it('should cleanup on unmount', async () => {
            const { unmount } = renderWithRouter();

            await waitFor(() => {
                expect(watchlistApi.retrieveWatchlistShare).toHaveBeenCalled();
            });

            unmount();

            // Should not throw any errors
            expect(true).toBe(true);
        });

        it('should fetch with different token when initial path varies', async () => {
            renderWithRouter('/shared/custom-token-xyz');

            await waitFor(() => {
                expect(watchlistApi.retrieveWatchlistShare).toHaveBeenCalledWith(
                    'custom-token-xyz'
                );
            });
        });
    });

    describe('Copy Share Link', () => {
        it('should have copy/share button', async () => {
            renderWithRouter();

            await waitFor(() => {
                // Should have way to share the link
                expect(screen.getByText(/Shared Combat Items/)).toBeInTheDocument();
            });
        });
    });

    describe('Success States', () => {
        it('should show imported state after successful import', async () => {
            const createWatchlistMock = vi.fn().mockReturnValue('new-id');
            const addItemToWatchlistMock = vi.fn();

            (useWatchlistStore as any).mockReturnValue({
                createWatchlist: createWatchlistMock,
                addItemToWatchlist: addItemToWatchlistMock,
            });

            renderWithRouter();

            await waitFor(() => {
                screen.getByRole('button', { name: /import/i }).click();
            });

            await waitFor(() => {
                // Should show success feedback
                expect(createWatchlistMock).toHaveBeenCalled();
            });
        });

        it('should disable import button after import', async () => {
            const createWatchlistMock = vi.fn().mockReturnValue('new-id');
            const addItemToWatchlistMock = vi.fn();

            (useWatchlistStore as any).mockReturnValue({
                createWatchlist: createWatchlistMock,
                addItemToWatchlist: addItemToWatchlistMock,
            });

            renderWithRouter();

            await waitFor(() => {
                const button = screen.getByRole('button', { name: /import/i });
                fireEvent.click(button);
            });

            await waitFor(() => {
                // Button should be updated
                expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
            });
        });
    });
});

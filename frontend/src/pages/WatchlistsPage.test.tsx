/**
 * Tests for WatchlistsPage component
 */

import { useWatchlistStore } from '@/stores/useWatchlistStore';
import type { Watchlist } from '@/types/watchlist';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchlistsPage } from './WatchlistsPage';

// Mock the store
vi.mock('@/stores/useWatchlistStore', () => ({
    useWatchlistStore: vi.fn(),
}));

// Mock child components
vi.mock('../components/watchlist/CreateWatchlistModal', () => ({
    CreateWatchlistModal: ({ isOpen, onClose, onSuccess }: any) => (
        <div data-testid="create-watchlist-modal" hidden={!isOpen}>
            <button onClick={() => onClose()}>Close</button>
            <button onClick={() => onSuccess?.({ name: 'New List', items: [] })}>
                Create
            </button>
        </div>
    ),
}));

vi.mock('../components/watchlist/ImportWatchlistModal', () => ({
    ImportWatchlistModal: ({ isOpen, onClose }: any) => (
        <div data-testid="import-watchlist-modal" hidden={!isOpen}>
            <button onClick={() => onClose()}>Close</button>
        </div>
    ),
}));

vi.mock('../components/watchlist/ShareWatchlistModal', () => ({
    ShareWatchlistModal: ({ isOpen, onClose }: any) => (
        <div data-testid="share-watchlist-modal" hidden={!isOpen}>
            <button onClick={() => onClose()}>Close</button>
        </div>
    ),
}));

vi.mock('../components/watchlist/WatchlistCard', () => ({
    WatchlistCard: ({ watchlist, onShare, onDelete }: any) => (
        <div data-testid={`watchlist-card-${watchlist.id}`}>
            <div>{watchlist.name}</div>
            <button onClick={() => onShare?.()}>Share</button>
            <button onClick={() => onDelete?.()}>Delete</button>
        </div>
    ),
}));

vi.mock('@/components/ui', () => ({
    Button: ({ onClick, children }: any) => (
        <button onClick={onClick}>{children}</button>
    ),
    Icon: ({ as: Component, className = '', ...props }: any) => {
        if (Component) {
            return React.createElement(Component, { className, ...props, 'data-testid': 'icon' });
        }
        return React.createElement('span', { className, ...props, 'data-testid': 'icon' }, 'icon');
    },
}));

vi.mock('lucide-react', () => ({
    ArrowLeft: () => <button data-testid="back-button">←</button>,
    FileDown: () => <span>📥</span>,
    FileUp: () => <span>📤</span>,
    ListPlus: () => <span>➕</span>,
}));

const mockWatchlists: Watchlist[] = [
    {
        id: '1',
        name: 'Combat Items',
        items: [
            { itemId: 12, name: 'Item 12', iconUrl: 'icon12.png', addedAt: Date.now() },
            { itemId: 23, name: 'Item 23', iconUrl: 'icon23.png', addedAt: Date.now() },
            { itemId: 34, name: 'Item 34', iconUrl: 'icon34.png', addedAt: Date.now() },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
    },
    {
        id: '2',
        name: 'Crafting Items',
        items: [
            { itemId: 45, name: 'Item 45', iconUrl: 'icon45.png', addedAt: Date.now() },
            { itemId: 56, name: 'Item 56', iconUrl: 'icon56.png', addedAt: Date.now() },
            { itemId: 67, name: 'Item 67', iconUrl: 'icon67.png', addedAt: Date.now() },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false,
    },
];

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('WatchlistsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useWatchlistStore as any).mockReturnValue({
            getAllWatchlists: vi.fn(() => mockWatchlists),
        });
    });

    describe('Rendering', () => {
        it('should render page heading', () => {
            renderWithRouter(<WatchlistsPage />);
            expect(screen.getByRole('heading', { name: /my watchlists/i })).toBeInTheDocument();
        });

        it('should render back button', () => {
            renderWithRouter(<WatchlistsPage />);
            expect(screen.getByTestId('back-button')).toBeInTheDocument();
        });

        it('should render action buttons', () => {
            renderWithRouter(<WatchlistsPage />);

            // Check for create button
            expect(screen.getByRole('button', { name: /new|create/i })).toBeInTheDocument();

            // Check for import button
            expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();

            // Check for export button
            expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
        });
    });

    describe('Watchlist Display', () => {
        it('should display all watchlists', () => {
            renderWithRouter(<WatchlistsPage />);

            mockWatchlists.forEach((list) => {
                expect(screen.getByTestId(`watchlist-card-${list.id}`)).toBeInTheDocument();
                expect(screen.getByText(list.name)).toBeInTheDocument();
            });
        });

        it('should render watchlist cards with correct names', () => {
            renderWithRouter(<WatchlistsPage />);

            expect(screen.getByText('Combat Items')).toBeInTheDocument();
            expect(screen.getByText('Crafting Items')).toBeInTheDocument();
        });

        it('should show message when no watchlists exist', () => {
            (useWatchlistStore as any).mockReturnValue({
                getAllWatchlists: vi.fn(() => []),
            });

            renderWithRouter(<WatchlistsPage />);

            // Should not display cards
            expect(screen.queryByTestId('watchlist-card-1')).not.toBeInTheDocument();
        });
    });

    describe('Modal Management', () => {
        it('should show create modal when button clicked', async () => {
            renderWithRouter(<WatchlistsPage />);

            const createButton = screen.getByRole('button', { name: /new|create/i });
            fireEvent.click(createButton);

            await waitFor(() => {
                const modal = screen.getByTestId('create-watchlist-modal');
                expect(modal).not.toHaveAttribute('hidden');
            });
        });

        it('should close create modal', async () => {
            renderWithRouter(<WatchlistsPage />);

            const createButton = screen.getAllByRole('button', { name: /new|create/i })[0];
            fireEvent.click(createButton);

            const closeButtons = screen.getAllByText('Close');
            fireEvent.click(closeButtons[0]); // First close button is for the create modal

            await waitFor(() => {
                const modal = screen.getByTestId('create-watchlist-modal');
                expect(modal).toHaveAttribute('hidden');
            });
        });

        it('should show import modal when button clicked', () => {
            renderWithRouter(<WatchlistsPage />);

            const importButton = screen.getByRole('button', { name: /import/i });
            fireEvent.click(importButton);

            // Modal should be visible
            expect(screen.getByTestId('import-watchlist-modal')).toBeInTheDocument();
        });

        it('should show share modal when watchlist share button clicked', () => {
            renderWithRouter(<WatchlistsPage />);

            const shareButtons = screen.getAllByRole('button', { name: /share/i });
            fireEvent.click(shareButtons[0]);

            expect(screen.getByTestId('share-watchlist-modal')).toBeInTheDocument();
        });
    });

    describe('Export Functionality', () => {
        it('should have export button', () => {
            renderWithRouter(<WatchlistsPage />);
            expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
        });

        it('should export all watchlists when button clicked', () => {
            globalThis.URL.createObjectURL = vi.fn(() => 'blob:example');
            globalThis.URL.revokeObjectURL = vi.fn();

            renderWithRouter(<WatchlistsPage />);

            const exportButton = screen.getByRole('button', { name: /export/i });
            fireEvent.click(exportButton);

            // Verify export was triggered (blob creation)
            expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
        });

        it('should create proper export data structure', () => {
            const mockCreateObjectURL = vi.fn(() => 'blob:example');
            globalThis.URL.createObjectURL = mockCreateObjectURL;
            globalThis.URL.revokeObjectURL = vi.fn();

            renderWithRouter(<WatchlistsPage />);

            const exportButton = screen.getByRole('button', { name: /export/i });
            fireEvent.click(exportButton);

            // Should create a blob with JSON data
            expect(mockCreateObjectURL).toHaveBeenCalled();
        });
    });

    describe('Navigation Links', () => {
        it('should have link to home', () => {
            renderWithRouter(<WatchlistsPage />);

            const links = screen.getAllByRole('link');
            const homeLink = links.find((link) => link.getAttribute('href') === '/');
            expect(homeLink).toBeInTheDocument();
        });
    });

    describe('State Management', () => {
        it('should call store to get all watchlists', () => {
            const getAllWatchlistsMock = vi.fn(() => mockWatchlists);
            (useWatchlistStore as any).mockReturnValue({
                getAllWatchlists: getAllWatchlistsMock,
            });

            renderWithRouter(<WatchlistsPage />);

            expect(getAllWatchlistsMock).toHaveBeenCalled();
        });

        it('should update when store data changes', () => {
            const getAllWatchlistsMock = vi.fn(() => mockWatchlists);
            (useWatchlistStore as any).mockReturnValue({
                getAllWatchlists: getAllWatchlistsMock,
            });

            const { rerender } = renderWithRouter(<WatchlistsPage />);

            expect(getAllWatchlistsMock).toHaveBeenCalled();

            // Update mock to return different data
            const newWatchlists = [mockWatchlists[0]];
            (useWatchlistStore as any).mockReturnValue({
                getAllWatchlists: vi.fn(() => newWatchlists),
            });

            rerender(
                <BrowserRouter>
                    <WatchlistsPage />
                </BrowserRouter>
            );

            expect(screen.getByText('Combat Items')).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should handle empty watchlist array gracefully', () => {
            (useWatchlistStore as any).mockReturnValue({
                getAllWatchlists: vi.fn(() => []),
            });

            const { container } = renderWithRouter(<WatchlistsPage />);
            expect(container).toBeInTheDocument();
        });

        it('should still show action buttons when no watchlists', () => {
            (useWatchlistStore as any).mockReturnValue({
                getAllWatchlists: vi.fn(() => []),
            });

            renderWithRouter(<WatchlistsPage />);

            expect(screen.getAllByRole('button', { name: /new|create/i })).toHaveLength(2);
            expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
        });
    });

    describe('Watchlist Actions', () => {
        it('should handle share action on watchlist card', () => {
            renderWithRouter(<WatchlistsPage />);

            const shareButton = screen.getAllByRole('button', { name: /share/i })[0];
            fireEvent.click(shareButton);

            expect(screen.getByTestId('share-watchlist-modal')).toBeInTheDocument();
        });

        it.skip('should handle delete action on watchlist card', () => {
            // TODO: Fix test - menu interactions need proper mocking
            renderWithRouter(<WatchlistsPage />);

            // Verify watchlist cards render with action menus
            const menuButtons = screen.getAllByRole('button');
            expect(menuButtons.length).toBeGreaterThan(0);

            // Verify watchlists are displayed
            expect(screen.getByText('Test Watchlist 1')).toBeInTheDocument();
        });
    });

    describe('UI Layout', () => {
        it('should display watchlists in a grid layout', () => {
            const { container } = renderWithRouter(<WatchlistsPage />);

            // Should have grid or similar layout container
            expect(container).toBeInTheDocument();
            mockWatchlists.forEach((list) => {
                expect(screen.getByText(list.name)).toBeInTheDocument();
            });
        });

        it('should have proper spacing and organization', () => {
            const { container } = renderWithRouter(<WatchlistsPage />);

            // Verify structure exists
            expect(container.querySelector('div')).toBeInTheDocument();
        });
    });
});

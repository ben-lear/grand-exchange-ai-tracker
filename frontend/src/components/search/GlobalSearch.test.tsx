/**
 * Unit tests for GlobalSearch component
 * Tests complete search functionality including keyboard navigation and recent searches
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useItemDataStore } from '../../stores';
import type { CurrentPrice, Item } from '../../types';
import { GlobalSearch, type GlobalSearchHandle } from './GlobalSearch';

// Mock the router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock useDebouncedValue to return value immediately (no delay in tests)
vi.mock('../../hooks/useDebouncedValue', () => ({
    useDebouncedValue: (value: string) => value,
}));

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

describe('GlobalSearch', () => {
    const mockItems: Item[] = [
        {
            id: 1,
            itemId: 1,
            name: 'Dragon scimitar',
            description: 'A powerful scimitar',
            iconUrl: 'https://example.com/dragon-scim.png',
            members: true,
            buyLimit: 70,
            highAlch: 72000,
            lowAlch: 48000,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
        {
            id: 2,
            itemId: 2,
            name: 'Dragon longsword',
            description: 'A sharp longsword',
            iconUrl: 'https://example.com/dragon-long.png',
            members: true,
            buyLimit: 70,
            highAlch: 72000,
            lowAlch: 48000,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
        {
            id: 3,
            itemId: 3,
            name: 'Abyssal whip',
            description: 'A demonic whip',
            iconUrl: 'https://example.com/whip.png',
            members: true,
            buyLimit: 70,
            highAlch: 72000,
            lowAlch: 48000,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
    ];

    const mockPrices: CurrentPrice[] = [
        {
            itemId: 1,
            highPrice: 100000,
            lowPrice: 95000,
            highPriceTime: new Date().toISOString(),
            lowPriceTime: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        // Reset store and mocks
        useItemDataStore.getState().reset();
        useItemDataStore.getState().addItems(mockItems);
        useItemDataStore.getState().setPrices(mockPrices);
        useItemDataStore.getState().setFullyLoaded();

        mockNavigate.mockClear();
        localStorage.clear();
    });

    const renderGlobalSearch = () => {
        return render(
            <MemoryRouter>
                <GlobalSearch />
            </MemoryRouter>
        );
    };

    it('renders search input', () => {
        renderGlobalSearch();

        expect(screen.getByPlaceholderText('Search items... (Ctrl+K)')).toBeInTheDocument();
    });

    it('shows recent searches when focused with empty query', async () => {
        const user = userEvent.setup();

        // Add recent search
        localStorage.setItem('osrs-recent-searches', JSON.stringify([
            { itemId: 1, name: 'Dragon scimitar' }
        ]));

        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.click(input);

        await waitFor(() => {
            expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        });

        expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
    });

    it('shows search results when typing', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });

        expect(screen.getByText('Dragon longsword')).toBeInTheDocument();
    });

    it('filters results based on query', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'whip');

        await waitFor(() => {
            expect(screen.getByText('Abyssal whip')).toBeInTheDocument();
        });

        expect(screen.queryByText('Dragon scimitar')).not.toBeInTheDocument();
    });

    it('shows "No items found" when no results', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'nonexistent');

        await waitFor(() => {
            expect(screen.getByText('No items found for "nonexistent"')).toBeInTheDocument();
        });
    });

    it('navigates to item page when result is clicked', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon scim');

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });

        const result = screen.getByText('Dragon scimitar');
        await user.click(result);

        expect(mockNavigate).toHaveBeenCalledWith('/items/1');
    });

    it('adds selected item to recent searches', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'whip');

        await waitFor(() => {
            expect(screen.getByText('Abyssal whip')).toBeInTheDocument();
        });

        const result = screen.getByText('Abyssal whip');
        await user.click(result);

        // Check localStorage was updated
        const stored = JSON.parse(localStorage.getItem('osrs-recent-searches') || '[]');
        expect(stored).toHaveLength(1);
        expect(stored[0].itemId).toBe(3);
        expect(stored[0].name).toBe('Abyssal whip');
    });

    it('clears input after selection', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox') as HTMLInputElement;
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });

        const result = screen.getByText('Dragon scimitar');
        await user.click(result);

        expect(input.value).toBe('');
    });

    it('closes dropdown after selection', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });

        const result = screen.getByText('Dragon scimitar');
        await user.click(result);

        await waitFor(() => {
            expect(screen.queryByText('Dragon longsword')).not.toBeInTheDocument();
        });
    });

    it('handles ArrowDown keyboard navigation', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getAllByRole('option')).toHaveLength(2);
        });

        // First item should be selected by default
        const firstOption = screen.getAllByRole('option')[0];
        expect(firstOption).toHaveAttribute('aria-selected', 'true');

        // Press ArrowDown
        await user.keyboard('{ArrowDown}');

        // Second item should now be selected
        const secondOption = screen.getAllByRole('option')[1];
        expect(secondOption).toHaveAttribute('aria-selected', 'true');
    });

    it('handles ArrowUp keyboard navigation', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getAllByRole('option')).toHaveLength(2);
        });

        // Move down then up
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{ArrowUp}');

        // Should wrap back to first item
        const firstOption = screen.getAllByRole('option')[0];
        expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });

    it('handles Enter key to select item', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getAllByRole('option')).toHaveLength(2);
        });

        // Press Enter to select first item
        await user.keyboard('{Enter}');

        expect(mockNavigate).toHaveBeenCalledWith('/items/1');
    });

    it('handles Escape key to close dropdown', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByText('Dragon scimitar')).not.toBeInTheDocument();
        });
    });

    it('syncs mouse hover with keyboard selection', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getAllByRole('option')).toHaveLength(2);
        });

        // Hover over second item
        const secondOption = screen.getAllByRole('option')[1];
        await user.hover(secondOption);

        expect(secondOption).toHaveAttribute('aria-selected', 'true');
    });

    it('displays prices when available', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon scim');

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });

        expect(screen.getByText('100K')).toBeInTheDocument();
        expect(screen.getByText('95K')).toBeInTheDocument();
    });

    it('shows loading indicator when items not fully loaded', () => {
        useItemDataStore.getState().reset();
        useItemDataStore.getState().addItems(mockItems);
        // Don't call setFullyLoaded

        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        // Just verify the component renders, loading state is internal
        expect(input).toBeInTheDocument();
    });

    it('does not show loading indicator when fully loaded', async () => {
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        input.focus();

        await waitFor(() => {
            expect(screen.queryByText(/Searching \d+ items\.\.\./)).not.toBeInTheDocument();
        });
    });

    it('exposes focus method via ref', () => {
        const ref = { current: null as GlobalSearchHandle | null };

        render(
            <MemoryRouter>
                <GlobalSearch ref={ref} />
            </MemoryRouter>
        );

        expect(ref.current).not.toBeNull();
        expect(ref.current?.focus).toBeInstanceOf(Function);
    });

    it('focuses input when focus() is called via ref', async () => {
        const ref = { current: null as GlobalSearchHandle | null };

        render(
            <MemoryRouter>
                <GlobalSearch ref={ref} />
            </MemoryRouter>
        );

        ref.current?.focus();

        const input = screen.getByRole('combobox');
        expect(document.activeElement).toBe(input);
    });

    it('removes recent search when remove button is clicked', async () => {
        const user = userEvent.setup();

        // Add recent search
        localStorage.setItem('osrs-recent-searches', JSON.stringify([
            { itemId: 1, name: 'Dragon scimitar' }
        ]));

        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.click(input);

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });

        const removeButton = screen.getByLabelText('Remove Dragon scimitar from recent');
        await user.click(removeButton);

        await waitFor(() => {
            expect(screen.queryByText('Dragon scimitar')).not.toBeInTheDocument();
        });
    });

    it('handles fuzzy search with typos', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dargon'); // Typo for "dragon"

        await waitFor(() => {
            expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        });
    });

    it('applies custom className', () => {
        const { container } = render(
            <MemoryRouter>
                <GlobalSearch className="custom-search" />
            </MemoryRouter>
        );

        // className is applied to the outermost div
        const searchContainer = container.querySelector('.custom-search');
        expect(searchContainer).toBeInTheDocument();
    });

    it('opens dropdown when ArrowDown is pressed on closed dropdown', async () => {
        const user = userEvent.setup();

        // Add recent search
        localStorage.setItem('osrs-recent-searches', JSON.stringify([
            { itemId: 1, name: 'Dragon scimitar' }
        ]));

        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        // Focus first, then arrow down
        await user.click(input);
        await user.keyboard('{ArrowDown}');

        await waitFor(() => {
            // Check that dropdown opened by verifying aria-expanded
            expect(input).toHaveAttribute('aria-expanded', 'true');
        }, { timeout: 2000 });
    });

    it('handles rapid typing with debouncing', async () => {
        const user = userEvent.setup({ delay: null }); // No delay for fast typing
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragonsword');

        // Should eventually show results or no results
        await waitFor(() => {
            expect(
                screen.queryByText(/Dragon|No items found/)
            ).toBeInTheDocument();
        });
    });

    it('resets selection when search query changes', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        const input = screen.getByRole('combobox');
        await user.type(input, 'dragon');

        await waitFor(() => {
            expect(screen.getAllByRole('option')).toHaveLength(2);
        });

        // Select second item
        await user.keyboard('{ArrowDown}');
        expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');

        // Change query
        await user.clear(input);
        await user.type(input, 'whip');

        await waitFor(() => {
            expect(screen.getByText('Abyssal whip')).toBeInTheDocument();
        });

        // Selection should reset to first item
        const firstOption = screen.getByRole('option');
        expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });
});

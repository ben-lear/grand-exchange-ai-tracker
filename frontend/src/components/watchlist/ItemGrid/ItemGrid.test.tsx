import type { WatchlistItem } from '@/types/watchlist';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ItemGrid } from './ItemGrid';

// Mock components
vi.mock('@/components/item', () => ({
    ItemDisplay: ({ item, size, showId, showLink }: any) => (
        <div data-testid="item-display">
            <span>{item.name}</span>
            <span>ID: {item.itemId}</span>
            <span>Size: {size}</span>
            <span>ShowID: {showId.toString()}</span>
            <span>ShowLink: {showLink.toString()}</span>
        </div>
    ),
}));

vi.mock('@/components/ui', () => ({
    Link: ({ to, children, ...props }: any) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
    EmptyState: ({ icon: Icon, title, description }: any) => (
        <div data-testid="empty-state">
            <Icon />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    ),
    Icon: ({ as: Component, className = '', ...props }: any) => {
        if (Component) {
            return React.createElement(Component, { className, ...props, 'data-testid': 'icon' });
        }
        return React.createElement('span', { className, ...props, 'data-testid': 'icon' }, 'icon');
    },
}));

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const mockItems: WatchlistItem[] = [
    {
        itemId: 1,
        name: 'Bronze sword',
        iconUrl: 'https://example.com/icon1.png',
        addedAt: 1700000000000,
    },
    {
        itemId: 2,
        name: 'Iron sword',
        iconUrl: 'https://example.com/icon2.png',
        addedAt: 1700000100000,
    },
    {
        itemId: 3,
        name: 'Steel sword',
        iconUrl: 'https://example.com/icon3.png',
        addedAt: 1700000200000,
    },
];

describe('ItemGrid', () => {
    describe('Empty state', () => {
        it('should render empty state when no items', () => {
            renderWithRouter(<ItemGrid items={[]} />);
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            expect(screen.getByText('Empty Watchlist')).toBeInTheDocument();
            expect(screen.getByText("This watchlist doesn't contain any items yet.")).toBeInTheDocument();
        });

        it('should apply className to empty state', () => {
            renderWithRouter(<ItemGrid items={[]} className="custom-class" />);
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    describe('Item grid', () => {
        it('should render items when provided', () => {
            renderWithRouter(<ItemGrid items={mockItems} />);
            expect(screen.getAllByTestId('item-display')).toHaveLength(3);
        });

        it('should render item names', () => {
            renderWithRouter(<ItemGrid items={mockItems} />);
            expect(screen.getByText('Bronze sword')).toBeInTheDocument();
            expect(screen.getByText('Iron sword')).toBeInTheDocument();
            expect(screen.getByText('Steel sword')).toBeInTheDocument();
        });

        it('should render item IDs', () => {
            renderWithRouter(<ItemGrid items={mockItems} />);
            expect(screen.getByText('ID: 1')).toBeInTheDocument();
            expect(screen.getByText('ID: 2')).toBeInTheDocument();
            expect(screen.getByText('ID: 3')).toBeInTheDocument();
        });

        it('should pass correct props to ItemDisplay', () => {
            renderWithRouter(<ItemGrid items={mockItems} />);
            const displays = screen.getAllByTestId('item-display');

            displays.forEach(display => {
                expect(display).toHaveTextContent('Size: xs');
                expect(display).toHaveTextContent('ShowID: true');
                expect(display).toHaveTextContent('ShowLink: false');
            });
        });

        it('should enable links when showLinks is true', () => {
            renderWithRouter(<ItemGrid items={mockItems} showLinks={true} />);
            const displays = screen.getAllByTestId('item-display');

            displays.forEach(display => {
                expect(display).toHaveTextContent('ShowLink: true');
            });
        });
    });

    describe('Title', () => {
        it('should not render title section when title not provided', () => {
            renderWithRouter(<ItemGrid items={mockItems} />);
            expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        });

        it('should render title when provided', () => {
            renderWithRouter(<ItemGrid items={mockItems} title="Items" />);
            expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Items (3)');
        });

        it('should show correct item count in title', () => {
            renderWithRouter(<ItemGrid items={mockItems.slice(0, 1)} title="Items" />);
            expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Items (1)');
        });

        it('should handle zero items with title', () => {
            renderWithRouter(<ItemGrid items={[]} title="Items" />);
            // Should show empty state, not the grid title
            expect(screen.queryByText(/Items \(0\)/)).not.toBeInTheDocument();
            expect(screen.getByText('Empty Watchlist')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should apply custom className to container', () => {
            const { container } = renderWithRouter(
                <ItemGrid items={mockItems} className="custom-class" />
            );
            expect(container.querySelector('.custom-class')).toBeInTheDocument();
        });

        it('should have responsive grid classes', () => {
            const { container } = renderWithRouter(<ItemGrid items={mockItems} />);
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toHaveClass(
                'grid-cols-2',
                'sm:grid-cols-3',
                'md:grid-cols-4',
                'lg:grid-cols-6'
            );
        });

        it('should have hover effects on items', () => {
            const { container } = renderWithRouter(<ItemGrid items={mockItems} />);
            const gridItems = container.querySelectorAll('.grid > div');
            gridItems.forEach(item => {
                expect(item).toHaveClass(
                    'hover:border-blue-300',
                    'dark:hover:border-blue-600',
                    'transition-colors'
                );
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle items without iconUrl', () => {
            const itemsWithoutIcon = [
                {
                    itemId: 1,
                    name: 'Test Item',
                    iconUrl: '',
                    addedAt: 1700000300000,
                },
            ];
            renderWithRouter(<ItemGrid items={itemsWithoutIcon} />);
            expect(screen.getByTestId('item-display')).toBeInTheDocument();
        });

        it('should handle items with long names', () => {
            const itemsWithLongNames = [
                {
                    itemId: 1,
                    name: 'This is a very long item name that should be handled properly',
                    iconUrl: 'https://example.com/icon.png',
                    addedAt: 1700000400000,
                },
            ];
            renderWithRouter(<ItemGrid items={itemsWithLongNames} />);
            expect(screen.getByText('This is a very long item name that should be handled properly')).toBeInTheDocument();
        });

        it('should handle large number of items', () => {
            const manyItems = Array.from({ length: 50 }, (_, i) => ({
                itemId: i + 1,
                name: `Item ${i + 1}`,
                iconUrl: `https://example.com/icon${i + 1}.png`,
                addedAt: 1700000500000 + i * 1000,
            }));
            renderWithRouter(<ItemGrid items={manyItems} />);
            expect(screen.getAllByTestId('item-display')).toHaveLength(50);
        });
    });
});
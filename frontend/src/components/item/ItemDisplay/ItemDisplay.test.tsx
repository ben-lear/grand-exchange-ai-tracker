import type { Item } from '@/types';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ItemDisplay } from './ItemDisplay';

const mockItem: Item = {
    id: 1,
    itemId: 2,
    name: 'Cannonball',
    description: 'Ammo for the Dwarf Multicannon.',
    iconUrl: 'https://example.com/icon.png',
    members: false,
    buyLimit: 11000,
    highAlch: 5,
    lowAlch: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockMembersItem: Item = {
    ...mockItem,
    itemId: 4151,
    name: 'Abyssal whip',
    members: true,
};

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ItemDisplay', () => {
    describe('Rendering', () => {
        it('should render item name', () => {
            renderWithRouter(<ItemDisplay item={mockItem} />);
            expect(screen.getByText('Cannonball')).toBeInTheDocument();
        });

        it('should render item icon', () => {
            renderWithRouter(<ItemDisplay item={mockItem} />);
            const icon = screen.getByAltText('Cannonball');
            expect(icon).toBeInTheDocument();
        });

        it('should not show ID by default', () => {
            renderWithRouter(<ItemDisplay item={mockItem} />);
            expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
        });

        it('should show ID when showId is true', () => {
            renderWithRouter(<ItemDisplay item={mockItem} showId={true} />);
            expect(screen.getByText(/ID: 2/)).toBeInTheDocument();
        });

        it('should not show badges by default', () => {
            renderWithRouter(<ItemDisplay item={mockMembersItem} />);
            expect(screen.queryByText('Members')).not.toBeInTheDocument();
        });

        it('should show members badge when showBadges is true', () => {
            renderWithRouter(<ItemDisplay item={mockMembersItem} showBadges={true} />);
            expect(screen.getByText('Members')).toBeInTheDocument();
        });

        it('should not show members badge for F2P items even with showBadges', () => {
            renderWithRouter(<ItemDisplay item={mockItem} showBadges={true} />);
            expect(screen.queryByText('Members')).not.toBeInTheDocument();
        });
    });

    describe('Links', () => {
        it('should not be a link by default', () => {
            renderWithRouter(<ItemDisplay item={mockItem} />);
            const name = screen.getByText('Cannonball');
            expect(name.closest('a')).not.toBeInTheDocument();
        });

        it('should render as link when showLink is true', () => {
            renderWithRouter(<ItemDisplay item={mockItem} showLink={true} />);
            const link = screen.getByRole('link');
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', '/items/2/cannonball');
        });

        it('should generate correct URL with item ID and slug', () => {
            renderWithRouter(<ItemDisplay item={mockMembersItem} showLink={true} />);
            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', '/items/4151/abyssal-whip');
        });
    });

    describe('Size Variants', () => {
        it('should render with xs size', () => {
            renderWithRouter(<ItemDisplay item={mockItem} size="xs" />);
            const name = screen.getByText('Cannonball');
            expect(name).toHaveClass('text-xs');
        });

        it('should render with sm size', () => {
            renderWithRouter(<ItemDisplay item={mockItem} size="sm" />);
            const name = screen.getByText('Cannonball');
            expect(name).toHaveClass('text-sm');
        });

        it('should render with md size (default)', () => {
            renderWithRouter(<ItemDisplay item={mockItem} />);
            const name = screen.getByText('Cannonball');
            expect(name).toHaveClass('text-base');
        });

        it('should render with lg size', () => {
            renderWithRouter(<ItemDisplay item={mockItem} size="lg" />);
            const name = screen.getByText('Cannonball');
            expect(name).toHaveClass('text-lg');
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = renderWithRouter(
                <ItemDisplay item={mockItem} className="custom-class" />
            );
            // The className is applied to the main flex container
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have flex layout', () => {
            const { container } = renderWithRouter(<ItemDisplay item={mockItem} />);
            expect(container.firstChild?.firstChild).toHaveClass('flex', 'items-center');
        });
    });

    describe('Accessibility', () => {
        it('should have accessible icon alt text', () => {
            renderWithRouter(<ItemDisplay item={mockItem} />);
            const icon = screen.getByAltText('Cannonball');
            expect(icon).toBeInTheDocument();
        });

        it('should have proper link accessibility when showLink is true', () => {
            renderWithRouter(<ItemDisplay item={mockItem} showLink={true} />);
            const link = screen.getByRole('link');
            expect(link).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle long item names', () => {
            const longNameItem = {
                ...mockItem,
                name: 'This is a very long item name that should be handled properly',
            };
            renderWithRouter(<ItemDisplay item={longNameItem} />);
            expect(screen.getByText(longNameItem.name)).toBeInTheDocument();
        });

        it('should handle missing icon URL', () => {
            const noIconItem = { ...mockItem, iconUrl: '' };
            renderWithRouter(<ItemDisplay item={noIconItem} />);
            expect(screen.getByAltText('Cannonball')).toBeInTheDocument();
        });

        it('should render all options together', () => {
            renderWithRouter(
                <ItemDisplay
                    item={mockMembersItem}
                    size="lg"
                    showId={true}
                    showLink={true}
                    showBadges={true}
                />
            );
            expect(screen.getByText('Abyssal whip')).toBeInTheDocument();
            expect(screen.getByText(/ID: 4151/)).toBeInTheDocument();
            expect(screen.getByText('Members')).toBeInTheDocument();
            expect(screen.getByRole('link')).toBeInTheDocument();
        });
    });
});

import type { Item } from '@/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemMetadata } from './ItemMetadata';

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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
};

describe('ItemMetadata', () => {
    describe('Rendering', () => {
        it('should render title', () => {
            render(<ItemMetadata item={mockItem} />);
            expect(screen.getByText('Item Metadata')).toBeInTheDocument();
        });

        it('should render all metadata labels', () => {
            render(<ItemMetadata item={mockItem} />);
            expect(screen.getByText('Buy Limit')).toBeInTheDocument();
            expect(screen.getByText('Membership')).toBeInTheDocument();
            expect(screen.getByText('High Alchemy')).toBeInTheDocument();
            expect(screen.getByText('Low Alchemy')).toBeInTheDocument();
        });

        it('should display buy limit with formatting', () => {
            render(<ItemMetadata item={mockItem} />);
            expect(screen.getByText('11,000')).toBeInTheDocument();
            expect(screen.getByText('/ 4h')).toBeInTheDocument();
        });

        it('should display "Unknown" for zero buy limit', () => {
            const itemNoBuyLimit = { ...mockItem, buyLimit: 0 };
            render(<ItemMetadata item={itemNoBuyLimit} />);
            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });

        it('should display F2P membership status', () => {
            render(<ItemMetadata item={mockItem} />);
            expect(screen.getByText('Free-to-Play')).toBeInTheDocument();
        });

        it('should display members-only status', () => {
            const membersItem = { ...mockItem, members: true };
            render(<ItemMetadata item={membersItem} />);
            expect(screen.getByText('Members Only')).toBeInTheDocument();
        });

        it('should display high alchemy value', () => {
            render(<ItemMetadata item={mockItem} />);
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('should display low alchemy value', () => {
            render(<ItemMetadata item={mockItem} />);
            expect(screen.getByText('3')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero high alchemy value', () => {
            const itemNoHighAlch = { ...mockItem, highAlch: 0 };
            render(<ItemMetadata item={itemNoHighAlch} />);
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThan(0);
        });

        it('should handle zero low alchemy value', () => {
            const itemNoLowAlch = { ...mockItem, lowAlch: 0 };
            render(<ItemMetadata item={itemNoLowAlch} />);
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThan(0);
        });

        it('should handle high value buy limits', () => {
            const itemHighBuyLimit = { ...mockItem, buyLimit: 25000 };
            render(<ItemMetadata item={itemHighBuyLimit} />);
            expect(screen.getByText('25,000')).toBeInTheDocument();
        });

        it('should handle large alchemy values', () => {
            const itemLargeAlch = {
                ...mockItem,
                highAlch: 72000,
                lowAlch: 48000
            };
            render(<ItemMetadata item={itemLargeAlch} />);
            expect(screen.getByText('72.0K')).toBeInTheDocument();
            expect(screen.getByText('48.0K')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <ItemMetadata item={mockItem} className="custom-class" />
            );
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have default card styling', () => {
            const { container } = render(<ItemMetadata item={mockItem} />);
            expect(container.firstChild).toHaveClass(
                'rounded-lg',
                'border',
                'bg-white',
                'dark:bg-gray-900'
            );
        });

        it('should have responsive grid layout', () => {
            const { container } = render(<ItemMetadata item={mockItem} />);
            const grid = container.querySelector('dl');
            expect(grid).toHaveClass('grid');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            render(<ItemMetadata item={mockItem} />);
            const heading = screen.getByRole('heading', { level: 2 });
            expect(heading).toHaveTextContent('Item Metadata');
        });

        it('should use semantic definition list elements', () => {
            const { container } = render(<ItemMetadata item={mockItem} />);
            const definitionList = container.querySelector('dl');
            expect(definitionList).toBeInTheDocument();
        });

        it('should have proper dt/dd relationships', () => {
            const { container } = render(<ItemMetadata item={mockItem} />);
            const terms = container.querySelectorAll('dt');
            const definitions = container.querySelectorAll('dd');
            expect(terms.length).toBe(4);
            expect(definitions.length).toBe(4);
        });
    });
});

import type { Item } from '@/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemHeader } from './ItemHeader';

const mockItem: Item = {
    id: 1,
    itemId: 2,
    name: 'Cannonball',
    description: 'Ammo for the Dwarf Multicannon.',
    iconUrl: 'https://example.com/icon.png',
    members: false,
    buyLimit: 11000,
    highAlch: 4,
    lowAlch: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
};

const mockMembersItem: Item = {
    ...mockItem,
    itemId: 4151,
    name: 'Abyssal whip',
    description: 'A weapon from the abyss.',
    members: true,
};

describe('ItemHeader', () => {
    describe('Rendering', () => {
        it('should render item name', () => {
            render(<ItemHeader item={mockItem} />);
            expect(screen.getByText('Cannonball')).toBeInTheDocument();
        });

        it('should render item ID', () => {
            render(<ItemHeader item={mockItem} />);
            expect(screen.getByText('Item ID:')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });

        it('should render item description when provided', () => {
            render(<ItemHeader item={mockItem} />);
            expect(screen.getByText('Ammo for the Dwarf Multicannon.')).toBeInTheDocument();
        });

        it('should not render description section when description is empty', () => {
            const itemWithoutDesc = { ...mockItem, description: '' };
            render(<ItemHeader item={itemWithoutDesc} />);
            expect(screen.queryByText('Ammo for the Dwarf Multicannon.')).not.toBeInTheDocument();
        });

        it('should render members badge for members items', () => {
            render(<ItemHeader item={mockMembersItem} />);
            expect(screen.getByText('Members')).toBeInTheDocument();
        });

        it('should not render members badge for F2P items', () => {
            render(<ItemHeader item={mockItem} />);
            expect(screen.queryByText('Members')).not.toBeInTheDocument();
        });

        it('should render item icon', () => {
            render(<ItemHeader item={mockItem} />);
            const icon = screen.getByAltText('Cannonball');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(<ItemHeader item={mockItem} className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have default card styling', () => {
            const { container } = render(<ItemHeader item={mockItem} />);
            expect(container.firstChild).toHaveClass('rounded-lg', 'border', 'bg-white', 'dark:bg-gray-900');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            render(<ItemHeader item={mockItem} />);
            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toHaveTextContent('Cannonball');
        });

        it('should have accessible icon alt text', () => {
            render(<ItemHeader item={mockItem} />);
            const icon = screen.getByAltText('Cannonball');
            expect(icon).toBeInTheDocument();
        });
    });
});

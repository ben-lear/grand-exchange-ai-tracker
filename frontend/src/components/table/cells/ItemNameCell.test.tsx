import type { Item } from '@/types';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ItemNameCell } from './ItemNameCell';

const mockItem: Item = {
    id: 2,
    itemId: 2,
    name: 'Abyssal whip',
    description: 'A weapon from the abyss.',
    iconUrl: 'https://example.com/whip.png',
    members: true,
    buyLimit: 70,
    highAlch: 72000,
    lowAlch: 48000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ItemNameCell', () => {
    it('should render item name', () => {
        renderWithRouter(<ItemNameCell item={mockItem} />);
        expect(screen.getByText('Abyssal whip')).toBeInTheDocument();
    });

    it('should render item ID', () => {
        renderWithRouter(<ItemNameCell item={mockItem} />);
        expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should render item icon when iconUrl is provided', () => {
        renderWithRouter(<ItemNameCell item={mockItem} />);
        const img = screen.getByAltText('Abyssal whip');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/whip.png');
    });

    it('should not render icon when iconUrl is missing', () => {
        const itemWithoutIcon = { ...mockItem, iconUrl: '' };
        renderWithRouter(<ItemNameCell item={itemWithoutIcon} />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render link to item detail page', () => {
        renderWithRouter(<ItemNameCell item={mockItem} />);
        const link = screen.getByRole('link', { name: 'Abyssal whip' });
        expect(link).toHaveAttribute('href', '/items/2/abyssal-whip');
    });

    it('should apply lazy loading to icon', () => {
        renderWithRouter(<ItemNameCell item={mockItem} />);
        const img = screen.getByAltText('Abyssal whip');
        expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should apply correct styling to link', () => {
        renderWithRouter(<ItemNameCell item={mockItem} />);
        const link = screen.getByRole('link', { name: 'Abyssal whip' });
        expect(link).toHaveClass('text-blue-600');
        expect(link).toHaveClass('font-medium');
    });
});

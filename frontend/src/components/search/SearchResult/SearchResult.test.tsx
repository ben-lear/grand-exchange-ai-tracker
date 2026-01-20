/**
 * Unit tests for SearchResult component
 */

import type { Item } from '@/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SearchResult } from './SearchResult';

describe('SearchResult', () => {
    const mockItem: Item = {
        id: 1,
        itemId: 1,
        name: 'Test Item',
        description: 'Test description',
        iconUrl: 'https://example.com/icon.png',
        members: true,
        buyLimit: 10000,
        highAlch: 1000,
        lowAlch: 500,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
    };

    it('should render item name', () => {
        render(<SearchResult item={mockItem} />);
        expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('should render item icon', () => {
        render(<SearchResult item={mockItem} />);
        const img = screen.getByRole('img', { name: 'Test Item' });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', mockItem.iconUrl);
    });

    it('should show members badge for members items', () => {
        render(<SearchResult item={mockItem} />);
        expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('should show F2P for free items', () => {
        const f2pItem = { ...mockItem, members: false };
        render(<SearchResult item={f2pItem} />);
        expect(screen.queryByText('M')).not.toBeInTheDocument();
    });

    it('should render formatted price and change indicator when current price is provided', () => {
        const itemWithPrice = {
            ...mockItem,
            currentPrice: {
                itemId: 1,
                highPrice: 2500000,
                lowPrice: 2400000,
                change24h: 1.2,
            },
        };

        render(<SearchResult item={itemWithPrice} />);

        expect(screen.getByText('2.5M gp')).toBeInTheDocument();
        expect(screen.getByText('+1.2%')).toBeInTheDocument();
    });
});

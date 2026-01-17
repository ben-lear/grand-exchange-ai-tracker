/**
 * Unit tests for SearchResultItem component
 * Tests rendering of search results with prices
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CurrentPrice, Item } from '../../types';
import { SearchResultItem } from './SearchResultItem';

describe('SearchResultItem', () => {
    const mockItem: Item = {
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
    };

    const mockPrice: CurrentPrice = {
        itemId: 1,
        highPrice: 100000,
        lowPrice: 95000,
        highPriceTime: new Date().toISOString(),
        lowPriceTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    it('renders item name', () => {
        render(<SearchResultItem item={mockItem} />);

        expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
    });

    it('renders item icon when provided', () => {
        const { container } = render(<SearchResultItem item={mockItem} />);

        const icon = container.querySelector('img');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('src', 'https://example.com/dragon-scim.png');
        expect(icon).toHaveAttribute('alt', '');
    });

    it('does not render icon when iconUrl is undefined', () => {
        const itemWithoutIcon = { ...mockItem, iconUrl: '' };
        render(<SearchResultItem item={itemWithoutIcon} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders P2P badge for members items', () => {
        render(<SearchResultItem item={mockItem} />);

        expect(screen.getByText('P2P')).toBeInTheDocument();
    });

    it('does not render P2P badge for F2P items', () => {
        const f2pItem = { ...mockItem, members: false };
        render(<SearchResultItem item={f2pItem} />);

        expect(screen.queryByText('P2P')).not.toBeInTheDocument();
    });

    it('renders high price when provided', () => {
        render(<SearchResultItem item={mockItem} price={mockPrice} />);

        expect(screen.getByText('100K')).toBeInTheDocument();
    });

    it('renders low price when provided', () => {
        render(<SearchResultItem item={mockItem} price={mockPrice} />);

        expect(screen.getByText('95K')).toBeInTheDocument();
    });

    it('does not render prices when price is undefined', () => {
        const { container } = render(<SearchResultItem item={mockItem} />);

        // Prices container should not exist - check for price spans
        const priceSpans = container.querySelectorAll('.text-green-600, .text-red-600');
        expect(priceSpans.length).toBe(0);
    });

    it('does not render prices when both prices are null', () => {
        const priceWithNulls: CurrentPrice = {
            ...mockPrice,
            highPrice: null as any,
            lowPrice: null as any,
        };

        render(<SearchResultItem item={mockItem} price={priceWithNulls} />);

        expect(screen.queryByText(/K|M|B/)).not.toBeInTheDocument();
    });

    it('renders only highPrice when lowPrice is missing', () => {
        const priceWithHighOnly: CurrentPrice = {
            ...mockPrice,
            lowPrice: null as any,
        };

        render(<SearchResultItem item={mockItem} price={priceWithHighOnly} />);

        expect(screen.getByText('100K')).toBeInTheDocument();
        expect(screen.queryByText('95K')).not.toBeInTheDocument();
    });

    it('renders only lowPrice when highPrice is missing', () => {
        const priceWithLowOnly: CurrentPrice = {
            ...mockPrice,
            highPrice: null as any,
        };

        render(<SearchResultItem item={mockItem} price={priceWithLowOnly} />);

        expect(screen.getByText('95K')).toBeInTheDocument();
        expect(screen.queryByText('100K')).not.toBeInTheDocument();
    });

    it('applies correct styling to highPrice (green)', () => {
        render(<SearchResultItem item={mockItem} price={mockPrice} />);

        const highPriceElement = screen.getByText('100K');
        expect(highPriceElement).toHaveClass('text-green-600');
    });

    it('applies correct styling to lowPrice (red)', () => {
        render(<SearchResultItem item={mockItem} price={mockPrice} />);

        const lowPriceElement = screen.getByText('95K');
        expect(lowPriceElement).toHaveClass('text-red-600');
    });

    it('formats large prices correctly', () => {
        const highPrice: CurrentPrice = {
            ...mockPrice,
            highPrice: 5000000,
            lowPrice: 4800000,
        };

        render(<SearchResultItem item={mockItem} price={highPrice} />);

        expect(screen.getByText('5M')).toBeInTheDocument();
        expect(screen.getByText('4.8M')).toBeInTheDocument();
    });

    it('formats billion+ prices correctly', () => {
        const billionPrice: CurrentPrice = {
            ...mockPrice,
            highPrice: 2100000000,
            lowPrice: 2000000000,
        };

        render(<SearchResultItem item={mockItem} price={billionPrice} />);

        expect(screen.getByText('2.1B')).toBeInTheDocument();
        expect(screen.getByText('2B')).toBeInTheDocument();
    });

    it('truncates long item names', () => {
        const longNameItem = {
            ...mockItem,
            name: 'Very long item name that should be truncated',
        };

        render(<SearchResultItem item={longNameItem} />);

        const nameElement = screen.getByText('Very long item name that should be truncated');
        expect(nameElement).toHaveClass('truncate');
    });

    it('has proper flex layout', () => {
        const { container } = render(<SearchResultItem item={mockItem} price={mockPrice} />);

        // The fragment doesn't have classes, check inner div
        const flexContainer = container.querySelector('.flex.items-center.gap-2');
        expect(flexContainer).toBeInTheDocument();
    });

    it('icon has lazy loading', () => {
        const { container } = render(<SearchResultItem item={mockItem} />);

        const icon = container.querySelector('img');
        expect(icon).toHaveAttribute('loading', 'lazy');
    });

    it('icon has correct size classes', () => {
        const { container } = render(<SearchResultItem item={mockItem} />);

        const icon = container.querySelector('img');
        expect(icon).toHaveClass('w-6');
        expect(icon).toHaveClass('h-6');
    });

    it('renders with both icon and prices', () => {
        const { container } = render(<SearchResultItem item={mockItem} price={mockPrice} />);

        expect(container.querySelector('img')).toBeInTheDocument();
        expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        expect(screen.getByText('P2P')).toBeInTheDocument();
        expect(screen.getByText('100K')).toBeInTheDocument();
        expect(screen.getByText('95K')).toBeInTheDocument();
    });

    it('renders minimal version without icon or price', () => {
        const minimalItem = { ...mockItem, iconUrl: '', members: false };
        render(<SearchResultItem item={minimalItem} />);

        expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.queryByText('P2P')).not.toBeInTheDocument();
        expect(screen.queryByText(/K$/)).not.toBeInTheDocument();
    });
});

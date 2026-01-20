import type { CurrentPrice } from '@/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CurrentPriceCard } from './CurrentPriceCard';

const mockPrice: CurrentPrice = {
    itemId: 2,
    highPrice: 200,
    lowPrice: 180,
    highPriceTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    lowPriceTime: new Date(Date.now() - 240000).toISOString(),  // 4 minutes ago
    updatedAt: new Date(Date.now() - 60000).toISOString(),      // 1 minute ago
};

describe('CurrentPriceCard', () => {
    describe('Rendering', () => {
        it('should render title', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            expect(screen.getByText('Current Prices')).toBeInTheDocument();
        });

        it('should render all price sections', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            expect(screen.getByText('Buy Price (High)')).toBeInTheDocument();
            expect(screen.getByText('Sell Price (Low)')).toBeInTheDocument();
            expect(screen.getByText('Mid Price')).toBeInTheDocument();
            expect(screen.getByText('Flip Margin')).toBeInTheDocument();
        });

        it('should format buy price correctly', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            // formatGold(200) = "200"
            expect(screen.getByText('200')).toBeInTheDocument();
        });

        it('should format sell price correctly', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            // formatGold(180) = "180"
            expect(screen.getByText('180')).toBeInTheDocument();
        });

        it('should calculate and display mid price', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            // midPrice = (200 + 180) / 2 = 190
            expect(screen.getByText('190')).toBeInTheDocument();
        });

        it('should display updated time', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            expect(screen.getByText(/Updated:/)).toBeInTheDocument();
        });

        it('should display price timestamps when available', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            // Should show relative times for high and low prices
            const timestamps = screen.getAllByText(/ago|minute|second/);
            expect(timestamps.length).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing highPrice', () => {
            const priceWithoutHigh = { ...mockPrice, highPrice: null };
            render(<CurrentPriceCard price={priceWithoutHigh} />);
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThan(0);
        });

        it('should handle missing lowPrice', () => {
            const priceWithoutLow = { ...mockPrice, lowPrice: null };
            render(<CurrentPriceCard price={priceWithoutLow} />);
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThan(0);
        });

        it('should handle both prices missing', () => {
            const priceEmpty = {
                ...mockPrice,
                highPrice: null,
                lowPrice: null
            };
            render(<CurrentPriceCard price={priceEmpty} />);
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThan(2);
        });

        it('should calculate mid price with only highPrice', () => {
            const priceOnlyHigh = {
                ...mockPrice,
                highPrice: 100,
                lowPrice: null
            };
            render(<CurrentPriceCard price={priceOnlyHigh} />);
            // Check that mid price section shows 100
            const midPriceSection = screen.getByText('Mid Price').parentElement;
            expect(midPriceSection).toHaveTextContent('100');
        });

        it('should calculate mid price with only lowPrice', () => {
            const priceOnlyLow = {
                ...mockPrice,
                highPrice: null,
                lowPrice: 50
            };
            render(<CurrentPriceCard price={priceOnlyLow} />);
            // Check that mid price section shows 50
            const midPriceSection = screen.getByText('Mid Price').parentElement;
            expect(midPriceSection).toHaveTextContent('50');
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <CurrentPriceCard price={mockPrice} className="custom-class" />
            );
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have default card styling', () => {
            const { container } = render(<CurrentPriceCard price={mockPrice} />);
            expect(container.firstChild).toHaveClass(
                'rounded-lg',
                'border',
                'bg-white',
                'dark:bg-gray-900'
            );
        });

        it('should have responsive grid layout', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            const grid = screen.getByText('Buy Price (High)').parentElement?.parentElement;
            expect(grid).toHaveClass('grid');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            const heading = screen.getByRole('heading', { level: 2 });
            expect(heading).toHaveTextContent('Current Prices');
        });

        it('should have descriptive labels for each price', () => {
            render(<CurrentPriceCard price={mockPrice} />);
            expect(screen.getByText('Buy Price (High)')).toBeInTheDocument();
            expect(screen.getByText('Sell Price (Low)')).toBeInTheDocument();
            expect(screen.getByText('Mid Price')).toBeInTheDocument();
            expect(screen.getByText('Flip Margin')).toBeInTheDocument();
        });
    });
});

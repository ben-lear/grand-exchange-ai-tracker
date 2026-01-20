import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceDisplay } from '@/components/ui/PriceDisplay/PriceDisplay';

describe('PriceDisplay', () => {
    describe('Rendering', () => {
        it('should render formatted price', () => {
            render(<PriceDisplay value={1000000} type="high" />);
            expect(screen.getByText('1.0M')).toBeInTheDocument();
        });

        it('should format large numbers correctly', () => {
            render(<PriceDisplay value={1500000000} type="high" />);
            expect(screen.getByText('1.5B')).toBeInTheDocument();
        });

        it('should format small numbers correctly', () => {
            render(<PriceDisplay value={123} type="low" />);
            expect(screen.getByText('123')).toBeInTheDocument();
        });

        it('should format thousands correctly', () => {
            render(<PriceDisplay value={15000} type="mid" />);
            expect(screen.getByText('15.0K')).toBeInTheDocument();
        });
    });

    describe('Type Variants', () => {
        it('should apply high price color', () => {
            const { container } = render(<PriceDisplay value={1000} type="high" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('text-emerald-600');
        });

        it('should apply low price color', () => {
            const { container } = render(<PriceDisplay value={1000} type="low" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('text-rose-600');
        });

        it('should apply mid price color', () => {
            const { container } = render(<PriceDisplay value={1000} type="mid" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('text-blue-600');
        });

        it('should apply margin price color', () => {
            const { container } = render(<PriceDisplay value={1000} type="margin" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('text-purple-600');
        });
    });

    describe('Size Variants', () => {
        it('should apply small size', () => {
            const { container } = render(<PriceDisplay value={1000} type="high" size="sm" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('text-sm');
        });

        it('should apply medium size by default', () => {
            const { container } = render(<PriceDisplay value={1000} type="high" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('text-base');
        });

        it('should apply large size', () => {
            const { container } = render(<PriceDisplay value={1000} type="high" size="lg" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('text-lg');
        });
    });

    describe('Label Display', () => {
        it('should not show label by default', () => {
            render(<PriceDisplay value={1000} type="high" />);
            expect(screen.queryByText('High:')).not.toBeInTheDocument();
        });

        it('should show default label when showLabel is true', () => {
            render(<PriceDisplay value={1000} type="high" showLabel />);
            expect(screen.getByText('High:')).toBeInTheDocument();
        });

        it('should show custom label when provided', () => {
            render(<PriceDisplay value={1000} type="high" showLabel label="Buy" />);
            expect(screen.getByText('Buy:')).toBeInTheDocument();
            expect(screen.queryByText('High:')).not.toBeInTheDocument();
        });

        it('should show correct default labels for each type', () => {
            const { rerender } = render(<PriceDisplay value={1000} type="high" showLabel />);
            expect(screen.getByText('High:')).toBeInTheDocument();

            rerender(<PriceDisplay value={1000} type="low" showLabel />);
            expect(screen.getByText('Low:')).toBeInTheDocument();

            rerender(<PriceDisplay value={1000} type="mid" showLabel />);
            expect(screen.getByText('Mid:')).toBeInTheDocument();

            rerender(<PriceDisplay value={1000} type="margin" showLabel />);
            expect(screen.getByText('Margin:')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <PriceDisplay value={1000} type="high" className="custom-class" />
            );
            const span = container.querySelector('span');
            expect(span).toHaveClass('custom-class');
        });

        it('should have mono font class', () => {
            const { container } = render(<PriceDisplay value={1000} type="high" />);
            const span = container.querySelector('span');
            expect(span).toHaveClass('font-mono');
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero value', () => {
            render(<PriceDisplay value={0} type="mid" />);
            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('should handle negative values', () => {
            render(<PriceDisplay value={-1000} type="low" />);
            expect(screen.getByText('-1,000')).toBeInTheDocument();
        });

        it('should handle very large numbers', () => {
            render(<PriceDisplay value={999999999999} type="high" />);
            expect(screen.getByText('1000.0B')).toBeInTheDocument();
        });

        it('should handle decimal values', () => {
            render(<PriceDisplay value={1234.56} type="mid" />);
            // formatGold formats the full value including decimals
            expect(screen.getByText('1,234.56')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper aria-label without label', () => {
            render(<PriceDisplay value={1500000} type="high" />);
            const element = screen.getByLabelText('Price: 1.5M');
            expect(element).toBeInTheDocument();
        });

        it('should have proper aria-label with label', () => {
            render(<PriceDisplay value={1500000} type="high" showLabel />);
            const element = screen.getByLabelText('High price: 1.5M');
            expect(element).toBeInTheDocument();
        });

        it('should have proper aria-label with custom label', () => {
            render(<PriceDisplay value={1500000} type="high" showLabel label="Buy" />);
            const element = screen.getByLabelText('Buy price: 1.5M');
            expect(element).toBeInTheDocument();
        });
    });
});

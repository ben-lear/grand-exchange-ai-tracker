import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceCell } from './PriceCell';

describe('PriceCell', () => {
    it('should render formatted price for high type', () => {
        render(<PriceCell value={1234567} type="high" />);
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('should render formatted price for low type', () => {
        render(<PriceCell value={987654} type="low" />);
        expect(screen.getByText('987,654')).toBeInTheDocument();
    });

    it('should render gold format for mid type', () => {
        render(<PriceCell value={1500000} type="mid" />);
        expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    it('should render em dash when value is undefined', () => {
        render(<PriceCell value={undefined} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should render em dash when value is 0', () => {
        render(<PriceCell value={0} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should apply green color for high type', () => {
        render(<PriceCell value={1000} type="high" />);
        const span = screen.getByText('1,000');
        expect(span).toHaveClass('text-green-600');
    });

    it('should apply orange color for low type', () => {
        render(<PriceCell value={1000} type="low" />);
        const span = screen.getByText('1,000');
        expect(span).toHaveClass('text-orange-600');
    });

    it('should apply blue color for mid type', () => {
        render(<PriceCell value={1000000} type="mid" />);
        const span = screen.getByText('1.0M');
        expect(span).toHaveClass('text-blue-600');
    });

    it('should apply mono font class', () => {
        render(<PriceCell value={1000} />);
        const span = screen.getByText('1,000');
        expect(span).toHaveClass('font-mono');
    });

    it('should add title attribute when label is provided', () => {
        render(<PriceCell value={1000} label="Test Price" />);
        const span = screen.getByText('1,000');
        expect(span).toHaveAttribute('title', 'Test Price');
    });

    it('should default to mid type when type is not specified', () => {
        render(<PriceCell value={2500000} />);
        expect(screen.getByText('2.5M')).toBeInTheDocument();
        expect(screen.getByText('2.5M')).toHaveClass('text-blue-600');
    });

    it('should handle large numbers correctly', () => {
        render(<PriceCell value={1234567890} type="mid" />);
        expect(screen.getByText('1.2B')).toBeInTheDocument();
    });

    it('should handle small numbers correctly', () => {
        render(<PriceCell value={42} type="high" />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });
});

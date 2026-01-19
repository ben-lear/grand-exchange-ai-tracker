import { render, screen } from '@testing-library/react';
import { Loader2, Search, Star } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
    it('renders with default props', () => {
        render(<Icon as={Search} data-testid="icon" />);

        const icon = screen.getByTestId('icon');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('w-5', 'h-5', 'text-current');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders with custom size', () => {
        render(<Icon as={Search} size="sm" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('w-4', 'h-4');
    });

    it('renders with xs size', () => {
        render(<Icon as={Search} size="xs" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('w-3', 'h-3');
    });

    it('renders with lg size', () => {
        render(<Icon as={Search} size="lg" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('w-6', 'h-6');
    });

    it('renders with xl size', () => {
        render(<Icon as={Search} size="xl" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('w-8', 'h-8');
    });

    it('renders with custom color', () => {
        render(<Icon as={Search} color="muted" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });

    it('renders with primary color', () => {
        render(<Icon as={Search} color="primary" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('renders with success color', () => {
        render(<Icon as={Search} color="success" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('text-green-600', 'dark:text-green-400');
    });

    it('renders with warning color', () => {
        render(<Icon as={Star} color="warning" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('text-amber-600', 'dark:text-amber-400');
    });

    it('renders with error color', () => {
        render(<Icon as={Search} color="error" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('text-red-600', 'dark:text-red-400');
    });

    it('applies spin animation', () => {
        render(<Icon as={Loader2} spin data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('animate-spin');
    });

    it('renders with custom className', () => {
        render(<Icon as={Search} className="custom-class" data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('custom-class');
    });

    it('renders with aria-label and removes aria-hidden', () => {
        render(<Icon as={Search} aria-label="Search items" data-testid="icon" />);

        const icon = screen.getByTestId('icon');
        expect(icon).toHaveAttribute('aria-label', 'Search items');
        expect(icon).not.toHaveAttribute('aria-hidden');
    });

    it('is aria-hidden by default without aria-label', () => {
        render(<Icon as={Search} data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    });

    it('combines multiple variants', () => {
        render(<Icon as={Loader2} size="sm" color="primary" spin data-testid="icon" />);

        const icon = screen.getByTestId('icon');
        expect(icon).toHaveClass('w-4', 'h-4', 'text-blue-600', 'dark:text-blue-400', 'animate-spin');
    });

    it('works with different icon components', () => {
        const { rerender } = render(<Icon as={Search} data-testid="icon" />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();

        rerender(<Icon as={Star} data-testid="icon" />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();

        rerender(<Icon as={Loader2} data-testid="icon" />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('supports all size variants', () => {
        const sizes = [
            { size: 'xs' as const, class: 'w-3' },
            { size: 'sm' as const, class: 'w-4' },
            { size: 'md' as const, class: 'w-5' },
            { size: 'lg' as const, class: 'w-6' },
            { size: 'xl' as const, class: 'w-8' },
        ];

        sizes.forEach(({ size, class: expectedClass }) => {
            const { container } = render(<Icon as={Search} size={size} />);
            expect(container.firstChild).toHaveClass(expectedClass);
        });
    });

    it('has shrink-0 to prevent flex shrinking', () => {
        render(<Icon as={Search} data-testid="icon" />);

        expect(screen.getByTestId('icon')).toHaveClass('shrink-0');
    });
});

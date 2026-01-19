import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus, Search, Settings, X } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
    it('renders with default props', () => {
        render(<IconButton icon={Search} aria-label="Search" data-testid="button" />);

        const button = screen.getByTestId('button');
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveClass('h-10', 'w-10', 'p-2', 'rounded-lg');
    });

    it('renders icon correctly', () => {
        render(<IconButton icon={Search} aria-label="Search" data-testid="button" />);

        const button = screen.getByTestId('button');
        expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with primary variant', () => {
        render(<IconButton icon={Plus} variant="primary" aria-label="Add" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('bg-blue-600', 'text-white');
    });

    it('renders with ghost variant', () => {
        render(<IconButton icon={Settings} variant="ghost" aria-label="Settings" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('text-gray-600');
    });

    it('renders with destructive variant', () => {
        render(<IconButton icon={X} variant="destructive" aria-label="Delete" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('bg-red-600', 'text-white');
    });

    it('renders with toolbar variant', () => {
        render(<IconButton icon={Settings} variant="toolbar" aria-label="Settings" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('text-gray-600');
    });

    it('renders with close variant', () => {
        render(<IconButton icon={X} variant="close" aria-label="Close" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('text-gray-400');
    });

    it('renders with small size', () => {
        render(<IconButton icon={Search} size="sm" aria-label="Search" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('h-8', 'w-8', 'p-1.5');
    });

    it('renders with large size', () => {
        render(<IconButton icon={Search} size="lg" aria-label="Search" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('h-12', 'w-12', 'p-3');
    });

    it('renders with custom radius', () => {
        render(<IconButton icon={Search} radius="full" aria-label="Search" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('rounded-full');
    });

    it('renders loading state', () => {
        render(<IconButton icon={Search} loading aria-label="Loading" data-testid="button" />);

        const button = screen.getByTestId('button');
        expect(button).toBeDisabled();
        expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('disables button when disabled prop is true', () => {
        render(<IconButton icon={Search} disabled aria-label="Search" data-testid="button" />);

        expect(screen.getByTestId('button')).toBeDisabled();
    });

    it('disables button when loading', () => {
        render(<IconButton icon={Search} loading aria-label="Search" data-testid="button" />);

        expect(screen.getByTestId('button')).toBeDisabled();
    });

    it('handles click events', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();

        render(<IconButton icon={Search} onClick={onClick} aria-label="Search" data-testid="button" />);

        await user.click(screen.getByTestId('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not handle click when disabled', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();

        render(<IconButton icon={Search} onClick={onClick} disabled aria-label="Search" data-testid="button" />);

        await user.click(screen.getByTestId('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders with custom className', () => {
        render(<IconButton icon={Search} className="custom-class" aria-label="Search" data-testid="button" />);

        expect(screen.getByTestId('button')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
        const ref = { current: null };
        render(<IconButton icon={Search} ref={ref} aria-label="Search" data-testid="button" />);

        expect(ref.current).toBe(screen.getByTestId('button'));
    });

    it('passes through additional props', () => {
        render(
            <IconButton
                icon={Search}
                aria-label="Search"
                data-testid="button"
                title="Search items"
                type="button"
            />
        );

        const button = screen.getByTestId('button');
        expect(button).toHaveAttribute('title', 'Search items');
        expect(button).toHaveAttribute('type', 'button');
    });

    it('combines multiple variants', () => {
        render(
            <IconButton
                icon={Settings}
                variant="toolbar"
                size="sm"
                radius="full"
                aria-label="Settings"
                data-testid="button"
            />
        );

        const button = screen.getByTestId('button');
        expect(button).toHaveClass('text-gray-600', 'h-8', 'w-8', 'rounded-full');
    });

    it('has proper accessibility attributes', () => {
        render(<IconButton icon={Search} aria-label="Search items" data-testid="button" />);

        const button = screen.getByTestId('button');
        expect(button).toHaveAttribute('aria-label', 'Search items');
    });

    it('works with different icon components', () => {
        const { rerender } = render(<IconButton icon={Search} aria-label="Search" data-testid="button" />);
        expect(screen.getByTestId('button').querySelector('svg')).toBeInTheDocument();

        rerender(<IconButton icon={Plus} aria-label="Add" data-testid="button" />);
        expect(screen.getByTestId('button').querySelector('svg')).toBeInTheDocument();

        rerender(<IconButton icon={X} aria-label="Close" data-testid="button" />);
        expect(screen.getByTestId('button').querySelector('svg')).toBeInTheDocument();
    });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Package } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
    describe('Rendering', () => {
        it('should render title', () => {
            render(<EmptyState title="No items found" />);
            expect(screen.getByText('No items found')).toBeInTheDocument();
        });

        it('should render title and description', () => {
            render(
                <EmptyState
                    title="No items found"
                    description="Try adjusting your search filters"
                />
            );

            expect(screen.getByText('No items found')).toBeInTheDocument();
            expect(screen.getByText('Try adjusting your search filters')).toBeInTheDocument();
        });

        it('should render icon when provided', () => {
            const { container } = render(
                <EmptyState
                    icon={Package}
                    title="No items"
                />
            );

            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });

        it('should not render icon when not provided', () => {
            const { container } = render(<EmptyState title="No items" />);

            const icon = container.querySelector('svg');
            expect(icon).not.toBeInTheDocument();
        });

        it('should render action button when provided', () => {
            render(
                <EmptyState
                    title="No items"
                    action={{ label: 'Add Item', onClick: vi.fn() }}
                />
            );

            expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
        });

        it('should not render action button when not provided', () => {
            render(<EmptyState title="No items" />);

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('should call action.onClick when button is clicked', async () => {
            const user = userEvent.setup();
            const onClick = vi.fn();

            render(
                <EmptyState
                    title="No items"
                    action={{ label: 'Add Item', onClick }}
                />
            );

            const button = screen.getByRole('button', { name: 'Add Item' });
            await user.click(button);

            expect(onClick).toHaveBeenCalledOnce();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <EmptyState
                    title="No items"
                    className="custom-class"
                />
            );

            const emptyStateDiv = container.firstChild as HTMLElement;
            expect(emptyStateDiv).toHaveClass('custom-class');
        });

        it('should have default centering classes', () => {
            const { container } = render(<EmptyState title="No items" />);

            const emptyStateDiv = container.firstChild as HTMLElement;
            expect(emptyStateDiv).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
        });
    });

    describe('Edge Cases', () => {
        it('should handle long title text', () => {
            const longTitle = 'This is a very long title that should still be displayed correctly without breaking the layout';

            render(<EmptyState title={longTitle} />);
            expect(screen.getByText(longTitle)).toBeInTheDocument();
        });

        it('should handle long description text', () => {
            const longDescription = 'This is a very long description that provides detailed information about why the state is empty and what the user can do about it';

            render(
                <EmptyState
                    title="No items"
                    description={longDescription}
                />
            );

            expect(screen.getByText(longDescription)).toBeInTheDocument();
        });

        it('should handle all props combined', () => {
            const onClick = vi.fn();

            render(
                <EmptyState
                    icon={Package}
                    title="No items found"
                    description="Try adjusting your search"
                    action={{ label: 'Clear Search', onClick }}
                    className="my-custom-class"
                />
            );

            expect(screen.getByText('No items found')).toBeInTheDocument();
            expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Clear Search' })).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading role', () => {
            render(<EmptyState title="No items found" />);

            const heading = screen.getByRole('heading', { name: 'No items found' });
            expect(heading).toBeInTheDocument();
        });

        it('should have accessible button when action is provided', () => {
            render(
                <EmptyState
                    title="No items"
                    action={{ label: 'Add Item', onClick: vi.fn() }}
                />
            );

            const button = screen.getByRole('button', { name: 'Add Item' });
            expect(button).toHaveAccessibleName('Add Item');
        });
    });
});

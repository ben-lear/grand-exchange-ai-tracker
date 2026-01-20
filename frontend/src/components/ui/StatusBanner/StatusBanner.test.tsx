import { Button } from '@/components/ui/Button/Button';
import { StatusBanner } from '@/components/ui/StatusBanner/StatusBanner';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

describe('StatusBanner', () => {
    describe('Rendering', () => {
        it('should render title', () => {
            render(<StatusBanner variant="info" title="Information message" />);
            expect(screen.getByText('Information message')).toBeInTheDocument();
        });

        it('should render title and description', () => {
            render(
                <StatusBanner
                    variant="info"
                    title="Information"
                    description="This is additional context"
                />
            );

            expect(screen.getByText('Information')).toBeInTheDocument();
            expect(screen.getByText('This is additional context')).toBeInTheDocument();
        });

        it('should render with default icon for variant', () => {
            const { container } = render(
                <StatusBanner variant="info" title="Message" />
            );

            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });

        it('should render with custom icon when provided', () => {
            const { container } = render(
                <StatusBanner variant="info" title="Message" icon={Star} />
            );

            // Icon should be present
            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });

        it('should render action when provided', () => {
            render(
                <StatusBanner
                    variant="info"
                    title="Message"
                    action={<Button size="sm">Click Me</Button>}
                />
            );

            expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
        });

        it('should render close button when onClose provided', () => {
            render(
                <StatusBanner
                    variant="info"
                    title="Message"
                    onClose={vi.fn()}
                />
            );

            expect(screen.getByRole('button', { name: 'Close banner' })).toBeInTheDocument();
        });

        it('should not render close button when onClose not provided', () => {
            render(<StatusBanner variant="info" title="Message" />);

            expect(screen.queryByRole('button', { name: 'Close banner' })).not.toBeInTheDocument();
        });
    });

    describe('Variants', () => {
        it('should apply info variant styles', () => {
            const { container } = render(<StatusBanner variant="info" title="Info" />);
            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveClass('bg-blue-50');
        });

        it('should apply success variant styles', () => {
            const { container } = render(<StatusBanner variant="success" title="Success" />);
            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveClass('bg-green-50');
        });

        it('should apply warning variant styles', () => {
            const { container } = render(<StatusBanner variant="warning" title="Warning" />);
            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveClass('bg-yellow-50');
        });

        it('should apply error variant styles', () => {
            const { container } = render(<StatusBanner variant="error" title="Error" />);
            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveClass('bg-red-50');
        });

        it('should apply variant color classes to icon', () => {
            const { container } = render(<StatusBanner variant="success" title="Success" />);
            const icon = container.querySelector('svg');
            expect(icon).toHaveClass('text-green-600');
        });
    });

    describe('Interactions', () => {
        it('should call onClose when close button clicked', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();

            render(
                <StatusBanner
                    variant="info"
                    title="Message"
                    onClose={onClose}
                />
            );

            const closeButton = screen.getByRole('button', { name: 'Close banner' });
            await user.click(closeButton);

            expect(onClose).toHaveBeenCalledOnce();
        });

        it('should not throw when action is clicked', async () => {
            const user = userEvent.setup();
            const onClick = vi.fn();

            render(
                <StatusBanner
                    variant="info"
                    title="Message"
                    action={<Button size="sm" onClick={onClick}>Action</Button>}
                />
            );

            const actionButton = screen.getByRole('button', { name: 'Action' });
            await user.click(actionButton);

            expect(onClick).toHaveBeenCalledOnce();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <StatusBanner
                    variant="info"
                    title="Message"
                    className="custom-class"
                />
            );

            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveClass('custom-class');
        });

        it('should have proper layout classes', () => {
            const { container } = render(<StatusBanner variant="info" title="Message" />);
            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveClass('flex', 'items-start', 'gap-3');
        });
    });

    describe('Edge Cases', () => {
        it('should handle long title text', () => {
            const longTitle = 'This is a very long title that should wrap properly without breaking the layout of the status banner';

            render(<StatusBanner variant="info" title={longTitle} />);
            expect(screen.getByText(longTitle)).toBeInTheDocument();
        });

        it('should handle long description text', () => {
            const longDescription = 'This is a very long description that provides extensive details and should wrap properly to multiple lines without breaking the layout';

            render(
                <StatusBanner
                    variant="info"
                    title="Title"
                    description={longDescription}
                />
            );

            expect(screen.getByText(longDescription)).toBeInTheDocument();
        });

        it('should handle all props combined', () => {
            const onClose = vi.fn();
            const onClick = vi.fn();

            render(
                <StatusBanner
                    variant="success"
                    title="Success!"
                    description="Operation completed"
                    icon={Star}
                    action={<Button size="sm" onClick={onClick}>View</Button>}
                    onClose={onClose}
                    className="my-class"
                />
            );

            expect(screen.getByText('Success!')).toBeInTheDocument();
            expect(screen.getByText('Operation completed')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Close banner' })).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have alert role', () => {
            const { container } = render(<StatusBanner variant="info" title="Message" />);
            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveAttribute('role', 'alert');
        });

        it('should have aria-live attribute', () => {
            const { container } = render(<StatusBanner variant="info" title="Message" />);
            const banner = container.firstChild as HTMLElement;
            expect(banner).toHaveAttribute('aria-live', 'polite');
        });

        it('should have accessible close button label', () => {
            render(
                <StatusBanner
                    variant="info"
                    title="Message"
                    onClose={vi.fn()}
                />
            );

            const closeButton = screen.getByRole('button', { name: 'Close banner' });
            expect(closeButton).toHaveAccessibleName('Close banner');
        });
    });
});

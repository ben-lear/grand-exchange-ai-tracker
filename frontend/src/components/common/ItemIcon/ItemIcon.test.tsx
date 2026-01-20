import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ItemIcon } from './ItemIcon';

describe('ItemIcon', () => {
    const mockSrc = 'https://example.com/icon.png';
    const mockAlt = 'Dragon Scimitar';

    describe('Rendering', () => {
        it('should render image with src and alt', () => {
            render(<ItemIcon src={mockSrc} alt={mockAlt} />);
            // Query the container div, not the img element
            const container = screen.getAllByRole('img', { name: mockAlt })[0];
            expect(container).toBeInTheDocument();
        });

        it('should apply size variants', () => {
            const { container, rerender } = render(
                <ItemIcon src={mockSrc} alt={mockAlt} size="sm" />
            );

            let wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass('w-6', 'h-6');

            rerender(<ItemIcon src={mockSrc} alt={mockAlt} size="lg" />);
            wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass('w-12', 'h-12');
        });

        it('should show loading skeleton initially', () => {
            const { container } = render(<ItemIcon src={mockSrc} alt={mockAlt} />);
            const skeleton = container.querySelector('.animate-pulse');
            expect(skeleton).toBeInTheDocument();
        });

        it('should show loading skeleton when loading prop is true', () => {
            const { container } = render(
                <ItemIcon src={mockSrc} alt={mockAlt} loading={true} />
            );
            const skeleton = container.querySelector('.animate-pulse');
            expect(skeleton).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should show fallback icon on image error', async () => {
            const { container } = render(<ItemIcon src="invalid-url" alt={mockAlt} />);

            const img = container.querySelector('img');
            if (img) {
                img.dispatchEvent(new Event('error'));
            }

            await waitFor(() => {
                const fallbackIcon = container.querySelector('svg');
                expect(fallbackIcon).toBeInTheDocument();
            });
        });

        it('should call onError callback when image fails', async () => {
            const onError = vi.fn();
            const { container } = render(
                <ItemIcon src="invalid-url" alt={mockAlt} onError={onError} />
            );

            const img = container.querySelector('img');
            if (img) {
                img.dispatchEvent(new Event('error'));
            }

            await waitFor(() => {
                expect(onError).toHaveBeenCalledOnce();
            });
        });

        it('should show custom fallback when provided', async () => {
            const customFallback = <div>Custom Fallback</div>;
            const { container } = render(
                <ItemIcon src="invalid-url" alt={mockAlt} fallback={customFallback} />
            );

            const img = container.querySelector('img');
            if (img) {
                img.dispatchEvent(new Event('error'));
            }

            await waitFor(() => {
                expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
            });
        });
    });

    describe('Loading States', () => {
        it('should hide skeleton after image loads', async () => {
            const { container } = render(<ItemIcon src={mockSrc} alt={mockAlt} />);

            const img = container.querySelector('img');
            if (img) {
                img.dispatchEvent(new Event('load'));
            }

            await waitFor(() => {
                const skeleton = container.querySelector('.animate-pulse');
                expect(skeleton).not.toBeInTheDocument();
            });
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <ItemIcon src={mockSrc} alt={mockAlt} className="custom-class" />
            );
            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass('custom-class');
        });

        it('should have default styling classes', () => {
            const { container } = render(<ItemIcon src={mockSrc} alt={mockAlt} />);
            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass('rounded', 'border', 'overflow-hidden');
        });
    });

    describe('Accessibility', () => {
        it('should have proper role and aria-label', () => {
            render(<ItemIcon src={mockSrc} alt={mockAlt} />);
            // Query the container div with getAllByRole since both div and img have role="img"
            const wrapper = screen.getAllByRole('img', { name: mockAlt })[0];
            expect(wrapper).toBeInTheDocument();
        });
    });
});

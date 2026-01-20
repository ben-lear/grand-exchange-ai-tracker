/**
 * Unit tests for Skeleton component
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
    it('should render skeleton', () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom width', () => {
        const { container } = render(<Skeleton width="200px" />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.width).toBe('200px');
    });

    it('should render with custom height', () => {
        const { container } = render(<Skeleton height="50px" />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.height).toBe('50px');
    });

    it('renders circular variant', () => {
        const { container } = render(<Skeleton variant="circular" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
        const { container } = render(<Skeleton className="custom-skeleton" />);
        expect(container.firstChild).toHaveClass('custom-skeleton');
    });
});

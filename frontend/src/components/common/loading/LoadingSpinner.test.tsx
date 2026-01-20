/**
 * Unit tests for LoadingSpinner component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
    it('should render loading spinner', () => {
        render(<LoadingSpinner />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render with custom size', () => {
        render(<LoadingSpinner size="lg" />);
        expect(screen.getByRole('status')).toHaveClass('w-12', 'h-12');
    });

    it('should render with custom className', () => {
        render(<LoadingSpinner className="custom-spinner" />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveClass('custom-spinner');
    });

    it('should render message when provided', () => {
        render(<LoadingSpinner message="Loading data" />);
        expect(screen.getByText('Loading data')).toBeInTheDocument();
    });
});

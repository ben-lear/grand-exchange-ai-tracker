import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from './ErrorFallback';

describe('ErrorFallback', () => {
    const mockError = new Error('Test error message');
    const mockReset = vi.fn();

    beforeEach(() => {
        mockReset.mockClear();
    });

    describe('Rendering - Page Variant', () => {
        it('should render page variant with full page layout', () => {
            render(
                <ErrorFallback
                    error={mockError}
                    resetErrorBoundary={mockReset}
                    variant="page"
                />
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText('Test error message')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        });
    });

    describe('Rendering - Section Variant', () => {
        it('should render section variant with card layout', () => {
            render(
                <ErrorFallback
                    error={mockError}
                    resetErrorBoundary={mockReset}
                    variant="section"
                />
            );

            expect(screen.getByText('Error Loading Component')).toBeInTheDocument();
            expect(screen.getByText('Test error message')).toBeInTheDocument();
        });

        it('should show error stack in development mode', () => {
            const originalEnv = globalThis.process?.env?.NODE_ENV;
            if (globalThis.process?.env) {
                globalThis.process.env.NODE_ENV = 'development';
            }

            const errorWithStack = new Error('Test error');
            errorWithStack.stack = 'Error: Test error\n  at line 1';

            render(
                <ErrorFallback
                    error={errorWithStack}
                    resetErrorBoundary={mockReset}
                    variant="section"
                />
            );

            expect(screen.getByText('Show error details')).toBeInTheDocument();

            if (globalThis.process?.env && originalEnv !== undefined) {
                globalThis.process.env.NODE_ENV = originalEnv;
            }
        });
    });

    describe('Rendering - Inline Variant', () => {
        it('should render inline variant with compact layout', () => {
            render(
                <ErrorFallback
                    error={mockError}
                    resetErrorBoundary={mockReset}
                    variant="inline"
                />
            );

            expect(screen.getByText('Test error message')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        });

        it('should show default message when error.message is empty', () => {
            const emptyError = new Error();

            render(
                <ErrorFallback
                    error={emptyError}
                    resetErrorBoundary={mockReset}
                    variant="inline"
                />
            );

            expect(screen.getByText('An error occurred')).toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('should call resetErrorBoundary when Try Again button is clicked', async () => {
            const user = userEvent.setup();

            render(
                <ErrorFallback
                    error={mockError}
                    resetErrorBoundary={mockReset}
                    variant="section"
                />
            );

            const tryAgainButton = screen.getByRole('button', { name: /try again/i });
            await user.click(tryAgainButton);

            expect(mockReset).toHaveBeenCalledOnce();
        });

        it('should call resetErrorBoundary when Retry button is clicked (inline)', async () => {
            const user = userEvent.setup();

            render(
                <ErrorFallback
                    error={mockError}
                    resetErrorBoundary={mockReset}
                    variant="inline"
                />
            );

            const retryButton = screen.getByRole('button', { name: /retry/i });
            await user.click(retryButton);

            expect(mockReset).toHaveBeenCalledOnce();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined error message', () => {
            const noMessageError = new Error();

            render(
                <ErrorFallback
                    error={noMessageError}
                    resetErrorBoundary={mockReset}
                    variant="section"
                />
            );

            expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
        });

        it('should default to section variant when variant not specified', () => {
            render(
                <ErrorFallback error={mockError} resetErrorBoundary={mockReset} />
            );

            expect(screen.getByText('Error Loading Component')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper button roles', () => {
            render(
                <ErrorFallback
                    error={mockError}
                    resetErrorBoundary={mockReset}
                    variant="page"
                />
            );

            const button = screen.getByRole('button', { name: /try again/i });
            expect(button).toBeInTheDocument();
        });

        it('should have accessible error icon', () => {
            const { container } = render(
                <ErrorFallback
                    error={mockError}
                    resetErrorBoundary={mockReset}
                    variant="section"
                />
            );

            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });
    });
});

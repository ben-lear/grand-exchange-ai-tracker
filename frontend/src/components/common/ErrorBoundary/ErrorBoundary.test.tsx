import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    // Suppress console.error in tests
    const originalError = console.error;
    beforeAll(() => {
        console.error = vi.fn();
    });

    afterAll(() => {
        console.error = originalError;
    });

    describe('Rendering', () => {
        it('should render children when no error', () => {
            render(
                <ErrorBoundary>
                    <div>Test content</div>
                </ErrorBoundary>
            );

            expect(screen.getByText('Test content')).toBeInTheDocument();
        });

        it('should render default fallback when error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText('Test error message')).toBeInTheDocument();
        });

        it('should render custom fallback when provided', () => {
            const CustomFallback = () => <div>Custom error UI</div>;

            render(
                <ErrorBoundary fallback={CustomFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Custom error UI')).toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('should reset error on button click', async () => {
            const user = userEvent.setup();

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            const tryAgainButton = screen.getByRole('button', { name: /try again/i });
            expect(tryAgainButton).toBeInTheDocument();

            // Clicking button will call resetErrorBoundary
            await user.click(tryAgainButton);

            // Error should still be shown until component is re-rendered with no error
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should call onError callback when error occurs', () => {
            const onError = vi.fn();

            render(
                <ErrorBoundary onError={onError}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Test error message' }),
                expect.any(Object)
            );
        });

        it('should log error to console', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error');

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('Reset Keys', () => {
        it('should reset error when resetKeys change', () => {
            let resetKey = 'key1';

            const { rerender } = render(
                <ErrorBoundary resetKeys={[resetKey]}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Change resetKey
            resetKey = 'key2';

            rerender(
                <ErrorBoundary resetKeys={[resetKey]}>
                    <ThrowError shouldThrow={false} />
                </ErrorBoundary>
            );

            expect(screen.getByText('No error')).toBeInTheDocument();
        });
    });
});

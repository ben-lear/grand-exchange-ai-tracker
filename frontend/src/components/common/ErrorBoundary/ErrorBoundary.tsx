/**
 * ErrorBoundary component for catching and handling React errors
 */

import React, { Component, ReactNode } from 'react';

export interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
    variant?: 'page' | 'section' | 'inline';
}

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: React.ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary class component for catching errors in child components
 * 
 * Usage:
 * <ErrorBoundary fallback={ErrorFallback} onError={logError}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps): void {
        // Reset error state when resetKeys change
        if (this.state.hasError && this.props.resetKeys) {
            const prevKeys = prevProps.resetKeys || [];
            const currentKeys = this.props.resetKeys;

            const hasKeysChanged = currentKeys.some(
                (key, index) => key !== prevKeys[index]
            );

            if (hasKeysChanged) {
                this.reset();
            }
        }
    }

    reset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback;

            if (FallbackComponent) {
                return (
                    <FallbackComponent
                        error={this.state.error}
                        resetErrorBoundary={this.reset}
                    />
                );
            }

            // Default fallback
            return (
                <div className="p-4 text-center">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {this.state.error.message}
                    </p>
                    <button
                        onClick={this.reset}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

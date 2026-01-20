/**
 * Test utilities for consistent testing patterns
 *
 * @example
 * import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
    /** Initial route to navigate to */
    initialRoute?: string;
    /** Pre-configured query client (optional) */
    queryClient?: QueryClient;
}

/**
 * Creates a default query client for testing
 */
export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

/**
 * Renders a component with all necessary providers for testing
 *
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />);
 * expect(getByText('Hello')).toBeInTheDocument();
 */
export function renderWithProviders(
    ui: ReactElement,
    options: RenderWithProvidersOptions = {}
) {
    const {
        initialRoute = '/',
        queryClient = createTestQueryClient(),
        ...renderOptions
    } = options;

    // Set the initial route
    window.history.pushState({}, 'Test page', initialRoute);

    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>{children}</BrowserRouter>
            </QueryClientProvider>
        );
    }

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        queryClient,
    };
}

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';


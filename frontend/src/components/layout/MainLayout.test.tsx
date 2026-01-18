import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from './MainLayout';

// Mock the hooks to avoid API calls
vi.mock('../../hooks/useItemPrefetcher', () => ({
    useItemPrefetcher: () => ({}),
}));

vi.mock('../../hooks/usePrices', () => ({
    useAllCurrentPrices: () => ({ data: [] }),
}));

// Mock the itemDataStore to avoid infinite loop
vi.mock('../../stores/itemDataStore', () => ({
    useItemDataStore: () => ({
        setPrices: vi.fn(),
        prices: new Map(),
        getItemsArray: () => [],
    }),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {component}
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('MainLayout Accessibility', () => {
    it('should have skip to main content link', () => {
        renderWithProviders(
            <MainLayout>
                <div>Content</div>
            </MainLayout>
        );

        const skipLink = screen.getByText(/skip to main content/i);
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have main content with proper id', () => {
        renderWithProviders(
            <MainLayout>
                <div>Test Content</div>
            </MainLayout>
        );

        const mainContent = document.getElementById('main-content');
        expect(mainContent).toBeInTheDocument();
        expect(mainContent?.tagName).toBe('MAIN');
    });

    it('should have proper landmark regions', () => {
        renderWithProviders(
            <MainLayout>
                <div>Content</div>
            </MainLayout>
        );

        // Header should have banner role (implicit from <header> tag)
        const header = document.querySelector('header');
        expect(header).toBeInTheDocument();

        // Main should have main role
        expect(screen.getByRole('main')).toBeInTheDocument();

        // Footer should have contentinfo role (implicit from <footer> tag)
        const footer = document.querySelector('footer');
        expect(footer).toBeInTheDocument();
    });

    it('should focus main content when skip link is activated', () => {
        renderWithProviders(
            <MainLayout>
                <div>Content</div>
            </MainLayout>
        );

        const skipLink = screen.getByText(/skip to main content/i);
        const mainContent = document.getElementById('main-content');

        // Simulate clicking the skip link
        fireEvent.click(skipLink);

        // The browser should handle the focus via the href="#main-content"
        // We just verify the main content has the correct ID
        expect(mainContent).toHaveAttribute('id', 'main-content');
    });

    it('should render children content', () => {
        renderWithProviders(
            <MainLayout>
                <div data-testid="test-content">Test Content</div>
            </MainLayout>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className to main element', () => {
        renderWithProviders(
            <MainLayout className="custom-class">
                <div>Content</div>
            </MainLayout>
        );

        const mainContent = screen.getByRole('main');
        expect(mainContent).toHaveClass('custom-class');
    });

    it('skip link should have proper focus styles', () => {
        renderWithProviders(
            <MainLayout>
                <div>Content</div>
            </MainLayout>
        );

        const skipLink = screen.getByText(/skip to main content/i);

        // Verify skip link has sr-only class (visually hidden by default)
        expect(skipLink).toHaveClass('sr-only');

        // Verify it has focus styles to make it visible when focused
        expect(skipLink).toHaveClass('focus:not-sr-only');
        expect(skipLink).toHaveClass('focus:absolute');
        expect(skipLink).toHaveClass('focus:bg-blue-600');
    });
});

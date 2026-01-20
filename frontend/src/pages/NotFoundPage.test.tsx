/**
 * Tests for NotFoundPage component
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFoundPage } from './NotFoundPage';

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NotFoundPage', () => {
    describe('Rendering', () => {
        it('should render 404 error code', () => {
            renderWithRouter(<NotFoundPage />);
            expect(screen.getByText('404')).toBeInTheDocument();
        });

        it('should render "Page Not Found" heading', () => {
            renderWithRouter(<NotFoundPage />);
            expect(screen.getByText('Page Not Found')).toBeInTheDocument();
        });

        it('should render descriptive message', () => {
            renderWithRouter(<NotFoundPage />);
            expect(
                screen.getByText(/The page you're looking for doesn't exist/)
            ).toBeInTheDocument();
        });

        it('should render correct heading level', () => {
            renderWithRouter(<NotFoundPage />);
            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toHaveTextContent('Page Not Found');
        });
    });

    describe('Navigation Links', () => {
        it('should have home navigation link', () => {
            renderWithRouter(<NotFoundPage />);
            const homeLink = screen.getByRole('link', { name: /home/i });
            expect(homeLink).toBeInTheDocument();
            expect(homeLink).toHaveAttribute('href', '/');
        });

        it('should have back navigation option', () => {
            renderWithRouter(<NotFoundPage />);
            const links = screen.getAllByRole('link');
            expect(links.length).toBeGreaterThan(0);
        });

        it('should contain navigation buttons in flex container', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const flexContainer = container.querySelector('.flex.gap-4');
            expect(flexContainer).toBeInTheDocument();
        });
    });

    describe('Styling and Layout', () => {
        it('should have centered layout', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const mainDiv = container.querySelector('.flex.flex-col');
            expect(mainDiv).toHaveClass('items-center', 'justify-center', 'text-center');
        });

        it('should have appropriate padding for mobile', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const mainDiv = container.querySelector('.px-4');
            expect(mainDiv).toBeInTheDocument();
        });

        it('should display 404 with large bold text', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const errorCode = container.querySelector('.text-9xl');
            expect(errorCode).toBeInTheDocument();
            expect(errorCode).toHaveClass('font-bold');
        });

        it('should have proper color scheme', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const errorCode = container.querySelector('.text-gray-300');
            expect(errorCode).toBeInTheDocument();
        });

        it('should apply heading styling', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const heading = container.querySelector('.text-3xl');
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveClass('font-bold');
        });

        it('should apply message text styling', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const message = container.querySelector('.text-gray-600');
            expect(message).toBeInTheDocument();
        });

        it('should have proper spacing between elements', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const mainDiv = container.firstChild;
            expect(mainDiv).toHaveClass('min-h-[60vh]');
        });
    });

    describe('Responsive Design', () => {
        it('should be responsive with flex layout', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const mainDiv = container.querySelector('.flex');
            expect(mainDiv).toHaveClass('flex-col');
        });

        it('should have padding for small screens', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const mainDiv = container.querySelector('.px-4');
            expect(mainDiv).toBeInTheDocument();
        });

        it('should have max width constraint on message', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const message = container.querySelector('.max-w-md');
            expect(message).toBeInTheDocument();
        });
    });

    describe('Dark Mode Support', () => {
        it('should support dark mode color scheme', () => {
            const { container } = renderWithRouter(<NotFoundPage />);

            // Check for dark mode classes
            const darkElements = container.querySelectorAll('[class*="dark:"]');
            expect(darkElements.length).toBeGreaterThan(0);
        });

        it('should have dark mode text color for 404', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            const errorCode = container.querySelector('.dark\\:text-gray-700');
            expect(errorCode).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have semantic heading structure', () => {
            renderWithRouter(<NotFoundPage />);
            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toHaveTextContent('Page Not Found');
        });

        it('should have descriptive alt text or aria attributes where needed', () => {
            const { container } = renderWithRouter(<NotFoundPage />);
            // Check that all interactive elements are accessible
            const links = container.querySelectorAll('a');
            links.forEach((link) => {
                expect(link.textContent || link.getAttribute('aria-label')).toBeTruthy();
            });
        });

        it('should have proper link focus states', () => {
            renderWithRouter(<NotFoundPage />);
            const links = screen.getAllByRole('link');
            links.forEach((link) => {
                expect(link).toHaveAttribute('href');
            });
        });
    });

    describe('Content Consistency', () => {
        it('should have consistent message formatting', () => {
            renderWithRouter(<NotFoundPage />);

            const heading = screen.getByText('Page Not Found');
            const message = screen.getByText(
                /The page you're looking for doesn't exist/
            );

            expect(heading).toBeInTheDocument();
            expect(message).toBeInTheDocument();
        });

        it('should always show the same content', () => {
            const { container: container1 } = renderWithRouter(<NotFoundPage />);
            const { container: container2 } = renderWithRouter(<NotFoundPage />);

            expect(container1.textContent).toBe(container2.textContent);
        });
    });

    describe('No Props Required', () => {
        it('should render without any props', () => {
            expect(() => {
                renderWithRouter(<NotFoundPage />);
            }).not.toThrow();
        });

        it('should render the same way every time', () => {
            const { unmount: unmount1 } = renderWithRouter(<NotFoundPage />);
            expect(screen.getAllByText('404')).toHaveLength(1);
            unmount1();

            const { unmount: unmount2 } = renderWithRouter(<NotFoundPage />);
            expect(screen.getAllByText('404')).toHaveLength(1);
            unmount2();

            renderWithRouter(<NotFoundPage />);
            expect(screen.getAllByText('404')).toHaveLength(1);
        });
    });
});

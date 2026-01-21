import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ImportSuccessBanner } from './ImportSuccessBanner';

// Mock the StatusBanner component
vi.mock('@/components/ui', () => ({
    StatusBanner: ({ variant, title, description, icon: Icon, className }: any) => (
        <div data-testid="status-banner" data-variant={variant} className={className}>
            <Icon className="w-5 h-5" />
            <h3>{title}</h3>
            <div>{description}</div>
        </div>
    ),
    Link: ({ to, children, ...props }: any) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ImportSuccessBanner', () => {
    const defaultProps = {
        watchlistName: 'My Favorite Items',
    };

    describe('Rendering', () => {
        it('should render with correct variant', () => {
            renderWithRouter(<ImportSuccessBanner {...defaultProps} />);
            const banner = screen.getByTestId('status-banner');
            expect(banner).toHaveAttribute('data-variant', 'success');
        });

        it('should display success title', () => {
            renderWithRouter(<ImportSuccessBanner {...defaultProps} />);
            expect(screen.getByText('Watchlist imported successfully!')).toBeInTheDocument();
        });

        it('should display watchlist name', () => {
            renderWithRouter(<ImportSuccessBanner {...defaultProps} />);
            expect(screen.getByText(/My Favorite Items \(Imported\)/)).toBeInTheDocument();
        });

        it('should include link to watchlists page', () => {
            renderWithRouter(<ImportSuccessBanner {...defaultProps} />);
            const link = screen.getByRole('link', { name: 'watchlists' });
            expect(link).toHaveAttribute('href', '/watchlists');
        });
    });

    describe('Watchlist name handling', () => {
        it('should handle long watchlist names', () => {
            const longName = 'This is a very long watchlist name that should still render properly';
            renderWithRouter(<ImportSuccessBanner watchlistName={longName} />);
            expect(screen.getByText(new RegExp(`${longName} \\(Imported\\)`))).toBeInTheDocument();
        });

        it('should handle special characters in name', () => {
            const specialName = 'Items & Gear (PvP)';
            renderWithRouter(<ImportSuccessBanner watchlistName={specialName} />);
            expect(screen.getByText(new RegExp(`Items & Gear \\(PvP\\) \\(Imported\\)`))).toBeInTheDocument();
        });

        it('should handle empty watchlist name', () => {
            renderWithRouter(<ImportSuccessBanner watchlistName="" />);
            expect(screen.getByText(/ \(Imported\)/)).toBeInTheDocument();
        });
    });

    describe('Link behavior', () => {
        it('should have proper link styling classes', () => {
            renderWithRouter(<ImportSuccessBanner {...defaultProps} />);
            const link = screen.getByRole('link', { name: 'watchlists' });
            expect(link).toHaveAttribute('href', '/watchlists');
        });

        it('should navigate to correct URL', () => {
            renderWithRouter(<ImportSuccessBanner {...defaultProps} />);
            const link = screen.getByRole('link', { name: 'watchlists' });
            expect(link.getAttribute('href')).toBe('/watchlists');
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = renderWithRouter(
                <ImportSuccessBanner {...defaultProps} className="custom-class" />
            );
            // The className will be passed to StatusBanner
            expect(container.querySelector('.custom-class')).toBeInTheDocument();
        });
    });
});
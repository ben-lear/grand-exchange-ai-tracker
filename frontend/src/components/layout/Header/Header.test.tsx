/**
 * Unit tests for Header component
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

// Mock GlobalSearch
vi.mock('@/components/search', () => ({
    GlobalSearch: () => <div data-testid="global-search">Search</div>,
}));

describe('Header', () => {
    const renderHeader = () => {
        return render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
    };

    it('should render header', () => {
        const { container } = renderHeader();
        expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should render logo/title', () => {
        renderHeader();
        expect(screen.getByText(/Grand Exchange/i)).toBeInTheDocument();
    });

    it('should render global search', () => {
        renderHeader();
        expect(screen.getAllByTestId('global-search').length).toBeGreaterThan(0);
    });

    it('should render navigation links', () => {
        renderHeader();
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
    });
});

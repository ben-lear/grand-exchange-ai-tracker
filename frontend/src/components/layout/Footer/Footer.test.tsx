/**
 * Unit tests for Footer component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
    it('should render footer', () => {
        const { container } = render(<Footer />);
        expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('should display copyright text', () => {
        render(<Footer />);
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument(); // Year
    });

    it('should render footer links', () => {
        render(<Footer />);
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
    });
});

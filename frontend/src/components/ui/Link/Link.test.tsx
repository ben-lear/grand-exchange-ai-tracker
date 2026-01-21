/**
 * Link component tests
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Link } from './Link';

describe('Link', () => {
    it('renders an internal router link', () => {
        render(
            <MemoryRouter>
                <Link to="/items/123">View item</Link>
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: 'View item' });
        expect(link).toHaveAttribute('href', '/items/123');
    });

    it('renders an external anchor link with target and rel', () => {
        render(
            <Link to="https://example.com" external>
                External
            </Link>
        );

        const link = screen.getByRole('link', { name: 'External' });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('applies variant and underline styles', () => {
        render(
            <MemoryRouter>
                <Link to="/test" variant="primary" underline="always">
                    Styled Link
                </Link>
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: 'Styled Link' });
        expect(link.className).toMatch(/text-blue-600/);
        expect(link.className).toMatch(/underline/);
    });
});

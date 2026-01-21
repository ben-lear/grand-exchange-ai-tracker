/**
 * ListItem component tests
 */

import { render, screen } from '@testing-library/react';
import { Star } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { ListItem } from './ListItem';

describe('ListItem', () => {
    it('renders content', () => {
        render(<ListItem>Item text</ListItem>);
        expect(screen.getByText('Item text')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        const { container } = render(<ListItem icon={Star}>Item text</ListItem>);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});

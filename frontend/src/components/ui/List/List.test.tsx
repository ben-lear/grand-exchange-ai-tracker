/**
 * List component tests
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { List } from './List';

describe('List', () => {
    it('renders an unordered list by default', () => {
        const { container } = render(
            <List>
                <li>Item</li>
            </List>
        );

        expect(container.querySelector('ul')).toBeInTheDocument();
    });

    it('renders an ordered list when variant is ordered', () => {
        const { container } = render(
            <List variant="ordered">
                <li>Item</li>
            </List>
        );

        expect(container.querySelector('ol')).toBeInTheDocument();
    });

    it('applies spacing and marker classes', () => {
        const { container } = render(
            <List spacing="loose" marker="square">
                <li>Item</li>
            </List>
        );

        const list = container.querySelector('ul');
        expect(list?.className).toMatch(/space-y-4/);
        expect(list?.className).toMatch(/list-square/);
    });

    it('renders unstyled list without markers', () => {
        const { container } = render(
            <List variant="unstyled">
                <li>Item</li>
            </List>
        );

        const list = container.querySelector('ul');
        expect(list?.className).toMatch(/list-none/);
    });
});

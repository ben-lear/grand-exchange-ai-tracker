/**
 * Unit tests for Card component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
    describe('Rendering', () => {
        it('should render card with children', () => {
            render(
                <Card>
                    <p>Card content</p>
                </Card>
            );

            expect(screen.getByText('Card content')).toBeInTheDocument();
        });

        it('should render with custom className', () => {
            render(
                <Card className="custom-card">
                    <p>Content</p>
                </Card>
            );

            const card = screen.getByText('Content').parentElement;
            expect(card).toHaveClass('custom-card');
        });

        it('should support padding variants', () => {
            const { rerender } = render(
                <Card padding="none">
                    <p>No padding</p>
                </Card>
            );

            expect(screen.getByText('No padding')).toBeInTheDocument();

            rerender(
                <Card padding="sm">
                    <p>Small padding</p>
                </Card>
            );
            expect(screen.getByText('Small padding')).toBeInTheDocument();

            rerender(
                <Card padding="base">
                    <p>Base padding</p>
                </Card>
            );
            expect(screen.getByText('Base padding')).toBeInTheDocument();

            rerender(
                <Card padding="lg">
                    <p>Large padding</p>
                </Card>
            );
            expect(screen.getByText('Large padding')).toBeInTheDocument();
        });

        it('should render with elevated variant', () => {
            render(
                <Card variant="elevated">
                    <p>Elevated card</p>
                </Card>
            );

            expect(screen.getByText('Elevated card')).toBeInTheDocument();
        });
    });

    describe('As different HTML elements', () => {
        it('should render as div by default', () => {
            const { container } = render(
                <Card>
                    <p>Content</p>
                </Card>
            );

            expect(container.querySelector('div')).toBeInTheDocument();
        });
    });
});

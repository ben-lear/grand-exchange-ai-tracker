/**
 * Unit tests for Button component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
    describe('Rendering', () => {
        it('should render button with text', () => {
            render(<Button>Click me</Button>);

            expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
        });

        it('should render primary variant', () => {
            render(<Button variant="primary">Primary</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should render secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should render ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should render destructive variant', () => {
            render(<Button variant="destructive">Destructive</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });

    describe('Sizes', () => {
        it('should render small size', () => {
            render(<Button size="sm">Small</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should render default size', () => {
            render(<Button size="default">Default</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should render large size', () => {
            render(<Button size="lg">Large</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });

    describe('States', () => {
        it('should be disabled when disabled prop is true', () => {
            render(<Button disabled>Disabled</Button>);

            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('should show loading state', () => {
            render(<Button loading>Loading</Button>);

            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('should be full width when width prop is full', () => {
            render(<Button width="full">Full Width</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('w-full');
        });
    });

    describe('Interactions', () => {
        it('should call onClick handler when clicked', async () => {
            const handleClick = vi.fn();
            const user = userEvent.setup();

            render(<Button onClick={handleClick}>Click</Button>);

            await user.click(screen.getByRole('button'));

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should not call onClick when disabled', async () => {
            const handleClick = vi.fn();
            const user = userEvent.setup();

            render(<Button disabled onClick={handleClick}>Click</Button>);

            await user.click(screen.getByRole('button'));

            expect(handleClick).not.toHaveBeenCalled();
        });

        it('should not call onClick when loading', async () => {
            const handleClick = vi.fn();
            const user = userEvent.setup();

            render(<Button loading onClick={handleClick}>Click</Button>);

            await user.click(screen.getByRole('button'));

            expect(handleClick).not.toHaveBeenCalled();
        });
    });

    describe('Custom props', () => {
        it('should apply custom className', () => {
            render(<Button className="custom-class">Custom</Button>);

            expect(screen.getByRole('button')).toHaveClass('custom-class');
        });

        it('should support button type attribute', () => {
            render(<Button type="submit">Submit</Button>);

            expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
        });

        it('should render left and right icons when provided', () => {
            render(
                <Button
                    leftIcon={<span data-testid="left-icon">L</span>}
                    rightIcon={<span data-testid="right-icon">R</span>}
                >
                    Icons
                </Button>
            );

            expect(screen.getByTestId('left-icon')).toBeInTheDocument();
            expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        });
    });
});

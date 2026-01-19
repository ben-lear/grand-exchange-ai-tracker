import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stack } from './Stack';

describe('Stack', () => {
    it('renders with default props', () => {
        render(
            <Stack data-testid="stack">
                <div>Child 1</div>
                <div>Child 2</div>
            </Stack>
        );

        const stack = screen.getByTestId('stack');
        expect(stack).toBeInTheDocument();
        expect(stack.tagName).toBe('DIV');
        expect(stack).toHaveClass('flex', 'flex-row', 'items-start', 'justify-start', 'gap-0');
    });

    it('renders with custom direction', () => {
        render(
            <Stack direction="col" data-testid="stack">
                <div>Child</div>
            </Stack>
        );

        expect(screen.getByTestId('stack')).toHaveClass('flex-col');
    });

    it('renders with custom alignment', () => {
        render(
            <Stack align="center" data-testid="stack">
                <div>Child</div>
            </Stack>
        );

        expect(screen.getByTestId('stack')).toHaveClass('items-center');
    });

    it('renders with custom justification', () => {
        render(
            <Stack justify="between" data-testid="stack">
                <div>Child</div>
            </Stack>
        );

        expect(screen.getByTestId('stack')).toHaveClass('justify-between');
    });

    it('renders with custom gap', () => {
        render(
            <Stack gap={4} data-testid="stack">
                <div>Child</div>
            </Stack>
        );

        expect(screen.getByTestId('stack')).toHaveClass('gap-4');
    });

    it('renders with multiple variants', () => {
        render(
            <Stack direction="col" align="center" justify="between" gap={6} data-testid="stack">
                <div>Child</div>
            </Stack>
        );

        const stack = screen.getByTestId('stack');
        expect(stack).toHaveClass('flex-col', 'items-center', 'justify-between', 'gap-6');
    });

    it('renders with custom className', () => {
        render(
            <Stack className="custom-class" data-testid="stack">
                <div>Child</div>
            </Stack>
        );

        expect(screen.getByTestId('stack')).toHaveClass('custom-class');
    });

    it('renders as semantic HTML element', () => {
        render(
            <Stack as="nav" data-testid="stack">
                <a href="/">Link</a>
            </Stack>
        );

        const stack = screen.getByTestId('stack');
        expect(stack.tagName).toBe('NAV');
    });

    it('renders as ul element', () => {
        render(
            <Stack as="ul" data-testid="stack">
                <li>Item 1</li>
                <li>Item 2</li>
            </Stack>
        );

        const stack = screen.getByTestId('stack');
        expect(stack.tagName).toBe('UL');
    });

    it('forwards ref correctly', () => {
        const ref = { current: null };
        render(
            <Stack ref={ref} data-testid="stack">
                <div>Child</div>
            </Stack>
        );

        expect(ref.current).toBe(screen.getByTestId('stack'));
    });

    it('passes through additional props', () => {
        render(
            <Stack data-testid="stack" aria-label="Test stack" role="group">
                <div>Child</div>
            </Stack>
        );

        const stack = screen.getByTestId('stack');
        expect(stack).toHaveAttribute('aria-label', 'Test stack');
        expect(stack).toHaveAttribute('role', 'group');
    });

    it('supports all gap values', () => {
        const gaps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

        gaps.forEach((gap) => {
            const { container } = render(
                <Stack gap={gap}>
                    <div>Child</div>
                </Stack>
            );

            expect(container.firstChild).toHaveClass(`gap-${gap}`);
        });
    });
});

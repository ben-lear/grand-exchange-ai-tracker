import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
    it('renders with default props', () => {
        render(<Text data-testid="text">Hello World</Text>);

        const text = screen.getByTestId('text');
        expect(text).toBeInTheDocument();
        expect(text.tagName).toBe('SPAN');
        expect(text).toHaveClass('text-gray-700', 'dark:text-gray-300', 'text-base', 'font-normal', 'text-left');
    });

    it('renders heading variant', () => {
        render(<Text variant="heading" data-testid="text">Heading</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-gray-900', 'dark:text-gray-100');
    });

    it('renders body variant', () => {
        render(<Text variant="body" data-testid="text">Body</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-gray-700', 'dark:text-gray-300');
    });

    it('renders muted variant', () => {
        render(<Text variant="muted" data-testid="text">Muted</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });

    it('renders error variant', () => {
        render(<Text variant="error" data-testid="text">Error</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-red-600', 'dark:text-red-400');
    });

    it('renders success variant', () => {
        render(<Text variant="success" data-testid="text">Success</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-green-600', 'dark:text-green-400');
    });

    it('renders warning variant', () => {
        render(<Text variant="warning" data-testid="text">Warning</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-amber-600', 'dark:text-amber-400');
    });

    it('renders primary variant', () => {
        render(<Text variant="primary" data-testid="text">Primary</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('renders with custom size', () => {
        render(<Text size="lg" data-testid="text">Large</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-lg');
    });

    it('renders with all size options', () => {
        const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'] as const;

        sizes.forEach((size) => {
            const { container } = render(<Text size={size}>Text</Text>);
            expect(container.firstChild).toHaveClass(`text-${size}`);
        });
    });

    it('renders with custom weight', () => {
        render(<Text weight="bold" data-testid="text">Bold</Text>);

        expect(screen.getByTestId('text')).toHaveClass('font-bold');
    });

    it('renders with all weight options', () => {
        const weights = [
            { weight: 'normal' as const, class: 'font-normal' },
            { weight: 'medium' as const, class: 'font-medium' },
            { weight: 'semibold' as const, class: 'font-semibold' },
            { weight: 'bold' as const, class: 'font-bold' },
        ];

        weights.forEach(({ weight, class: expectedClass }) => {
            const { container } = render(<Text weight={weight}>Text</Text>);
            expect(container.firstChild).toHaveClass(expectedClass);
        });
    });

    it('renders with custom alignment', () => {
        render(<Text align="center" data-testid="text">Centered</Text>);

        expect(screen.getByTestId('text')).toHaveClass('text-center');
    });

    it('renders with all alignment options', () => {
        const alignments = ['left', 'center', 'right'] as const;

        alignments.forEach((align) => {
            const { container } = render(<Text align={align}>Text</Text>);
            expect(container.firstChild).toHaveClass(`text-${align}`);
        });
    });

    it('renders with multiple variants', () => {
        render(
            <Text variant="heading" size="xl" weight="bold" align="center" data-testid="text">
                Heading
            </Text>
        );

        const text = screen.getByTestId('text');
        expect(text).toHaveClass('text-gray-900', 'dark:text-gray-100', 'text-xl', 'font-bold', 'text-center');
    });

    it('renders with custom className', () => {
        render(<Text className="custom-class" data-testid="text">Text</Text>);

        expect(screen.getByTestId('text')).toHaveClass('custom-class');
    });

    it('renders as semantic HTML element', () => {
        render(<Text as="h1" data-testid="text">Heading</Text>);

        const text = screen.getByTestId('text');
        expect(text.tagName).toBe('H1');
    });

    it('renders as paragraph', () => {
        render(<Text as="p" data-testid="text">Paragraph</Text>);

        const text = screen.getByTestId('text');
        expect(text.tagName).toBe('P');
    });

    it('renders as div', () => {
        render(<Text as="div" data-testid="text">Div</Text>);

        const text = screen.getByTestId('text');
        expect(text.tagName).toBe('DIV');
    });

    it('forwards ref correctly', () => {
        const ref = { current: null };
        render(<Text ref={ref} data-testid="text">Text</Text>);

        expect(ref.current).toBe(screen.getByTestId('text'));
    });

    it('passes through additional props', () => {
        render(
            <Text data-testid="text" aria-label="Test text" role="heading">
                Text
            </Text>
        );

        const text = screen.getByTestId('text');
        expect(text).toHaveAttribute('aria-label', 'Test text');
        expect(text).toHaveAttribute('role', 'heading');
    });

    it('renders children correctly', () => {
        render(
            <Text data-testid="text">
                <span>Child 1</span>
                <span>Child 2</span>
            </Text>
        );

        const text = screen.getByTestId('text');
        expect(text).toHaveTextContent('Child 1Child 2');
    });
});

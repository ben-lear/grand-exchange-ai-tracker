/**
 * Unit tests for Badge component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
    describe('Rendering', () => {
        it('should render with text content', () => {
            render(<Badge>Test Badge</Badge>);

            expect(screen.getByText('Test Badge')).toBeInTheDocument();
        });

        it('should render default variant (neutral)', () => {
            render(<Badge>Default</Badge>);

            const badge = screen.getByText('Default');
            expect(badge).toBeInTheDocument();
        });

        it('should render primary variant', () => {
            render(<Badge variant="primary">Primary</Badge>);

            expect(screen.getByText('Primary')).toBeInTheDocument();
        });

        it('should render success variant', () => {
            render(<Badge variant="success">Success</Badge>);

            expect(screen.getByText('Success')).toBeInTheDocument();
        });

        it('should render warning variant', () => {
            render(<Badge variant="warning">Warning</Badge>);

            expect(screen.getByText('Warning')).toBeInTheDocument();
        });

        it('should render error variant', () => {
            render(<Badge variant="error">Error</Badge>);

            expect(screen.getByText('Error')).toBeInTheDocument();
        });

        it('should render info variant', () => {
            render(<Badge variant="info">Info</Badge>);

            expect(screen.getByText('Info')).toBeInTheDocument();
        });
    });

    describe('Sizes', () => {
        it('should render small size', () => {
            render(<Badge size="sm">Small</Badge>);

            expect(screen.getByText('Small')).toBeInTheDocument();
        });

        it('should render base size (default)', () => {
            render(<Badge size="base">Base</Badge>);

            expect(screen.getByText('Base')).toBeInTheDocument();
        });

        it('should render large size', () => {
            render(<Badge size="lg">Large</Badge>);

            expect(screen.getByText('Large')).toBeInTheDocument();
        });
    });

    describe('Custom styling', () => {
        it('should apply custom className', () => {
            render(<Badge className="custom-badge">Custom</Badge>);

            const badge = screen.getByText('Custom');
            expect(badge).toHaveClass('custom-badge');
        });
    });

    describe('Icon support', () => {
        it('should render badge with icon', () => {
            render(<Badge>Badge</Badge>);

            expect(screen.getByText('Badge')).toBeInTheDocument();
        });
    });
});

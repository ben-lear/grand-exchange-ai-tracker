/**
 * Unit tests for Alert component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
    describe('Rendering', () => {
        it('should render with default variant (info)', () => {
            render(<Alert>Test message</Alert>);

            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveTextContent('Test message');
        });

        it('should render success variant', () => {
            render(
                <Alert variant="success" icon={<CheckCircle className="w-5 h-5" />}>
                    Success message
                </Alert>
            );

            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveTextContent('Success message');
            expect(alert.querySelector('svg')).toBeInTheDocument();
        });

        it('should render warning variant', () => {
            render(
                <Alert variant="warning" icon={<AlertTriangle className="w-5 h-5" />}>
                    Warning message
                </Alert>
            );

            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveTextContent('Warning message');
        });

        it('should render error variant', () => {
            render(
                <Alert variant="error" icon={<XCircle className="w-5 h-5" />}>
                    Error message
                </Alert>
            );

            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveTextContent('Error message');
        });

        it('should render info variant', () => {
            render(
                <Alert variant="info" icon={<Info className="w-5 h-5" />}>
                    Info message
                </Alert>
            );

            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveTextContent('Info message');
        });

        it('should render without icon', () => {
            render(<Alert showIcon={false}>Message without icon</Alert>);

            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByRole('alert').querySelector('svg')).not.toBeInTheDocument();
        });
    });

    describe('Custom className', () => {
        it('should apply custom className', () => {
            render(<Alert className="custom-class">Test</Alert>);

            const alert = screen.getByRole('alert');
            expect(alert).toHaveClass('custom-class');
        });
    });

    describe('Interactions', () => {
        it('should call onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            const user = userEvent.setup();

            render(
                <Alert onClose={onClose} title="Closable" description="Dismiss me" />
            );

            const closeButton = screen.getByRole('button', { name: /dismiss/i });
            await user.click(closeButton);

            expect(onClose).toHaveBeenCalledOnce();
        });
    });
});

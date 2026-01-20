import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BackButton } from './BackButton';

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('BackButton', () => {
    describe('Rendering', () => {
        it('should render with default label', () => {
            renderWithRouter(<BackButton />);
            expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        });

        it('should render with custom label', () => {
            renderWithRouter(<BackButton label="Go Back" />);
            expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
        });

        it('should render back arrow icon', () => {
            const { container } = renderWithRouter(<BackButton />);
            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('should call custom onClick when provided', async () => {
            const user = userEvent.setup();
            const onClick = vi.fn();

            renderWithRouter(<BackButton onClick={onClick} />);

            const button = screen.getByRole('button', { name: 'Back' });
            await user.click(button);

            expect(onClick).toHaveBeenCalledOnce();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            renderWithRouter(<BackButton className="custom-class" />);
            const button = screen.getByRole('button', { name: 'Back' });
            expect(button).toHaveClass('custom-class');
        });

        it('should have default ghost button style', () => {
            renderWithRouter(<BackButton />);
            const button = screen.getByRole('button', { name: 'Back' });
            expect(button).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper aria-label', () => {
            renderWithRouter(<BackButton label="Back to Dashboard" />);
            const button = screen.getByRole('button', { name: 'Back to Dashboard' });
            expect(button).toHaveAccessibleName('Back to Dashboard');
        });

        it('should be keyboard accessible', async () => {
            const user = userEvent.setup();
            const onClick = vi.fn();

            renderWithRouter(<BackButton onClick={onClick} />);

            const button = screen.getByRole('button', { name: 'Back' });
            button.focus();
            await user.keyboard('{Enter}');

            expect(onClick).toHaveBeenCalledOnce();
        });
    });
});

/**
 * Unit tests for Input component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
    it('should render input field', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should handle text input', async () => {
        const user = userEvent.setup();
        render(<Input placeholder="Type here" />);

        const input = screen.getByPlaceholderText('Type here');
        await user.type(input, 'Hello');
        expect(input).toHaveValue('Hello');
    });

    it('should handle onChange', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(<Input placeholder="Type" onChange={handleChange} />);

        await user.type(screen.getByPlaceholderText('Type'), 'a');
        expect(handleChange).toHaveBeenCalled();
    });

    it('should be disabled', () => {
        render(<Input disabled placeholder="Disabled" />);
        expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
    });

    it('should show error state', () => {
        render(<Input variant="error" placeholder="Error input" />);
        expect(screen.getByPlaceholderText('Error input')).toBeInTheDocument();
    });

    it('should render left and right icons when provided', () => {
        render(
            <Input
                placeholder="With icons"
                leftIcon={<span data-testid="left-icon">L</span>}
                rightIcon={<span data-testid="right-icon">R</span>}
            />
        );

        const input = screen.getByPlaceholderText('With icons');
        expect(screen.getByTestId('left-icon')).toBeInTheDocument();
        expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        expect(input).toHaveClass('pl-9');
        expect(input).toHaveClass('pr-9');
    });
});

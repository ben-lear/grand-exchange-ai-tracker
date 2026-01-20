/**
 * Unit tests for Checkbox component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
    it('should render checkbox', () => {
        render(<Checkbox label="Test Checkbox" />);
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByText('Test Checkbox')).toBeInTheDocument();
    });

    it('should handle checked state', () => {
        render(<Checkbox label="Checked" checked />);
        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should handle onChange', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(<Checkbox label="Click me" onChange={handleChange} />);

        await user.click(screen.getByRole('checkbox'));
        expect(handleChange).toHaveBeenCalled();
    });

    it('should be disabled', () => {
        render(<Checkbox label="Disabled" disabled />);
        expect(screen.getByRole('checkbox')).toBeDisabled();
    });
});

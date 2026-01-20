/**
 * Unit tests for Radio component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Radio } from './Radio';

describe('Radio', () => {
    it('should render radio button', () => {
        render(<Radio label="Test Radio" value="test" />);
        expect(screen.getByRole('radio')).toBeInTheDocument();
        expect(screen.getByText('Test Radio')).toBeInTheDocument();
    });

    it('should handle checked state', () => {
        render(<Radio label="Checked" value="test" checked />);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('should handle onChange', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(<Radio label="Click me" value="test" onChange={handleChange} />);

        await user.click(screen.getByRole('radio'));
        expect(handleChange).toHaveBeenCalled();
    });

    it('should be disabled', () => {
        render(<Radio label="Disabled" value="test" disabled />);
        expect(screen.getByRole('radio')).toBeDisabled();
    });
});

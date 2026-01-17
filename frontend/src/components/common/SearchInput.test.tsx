/**
 * Unit tests for SearchInput component
 * Tests reusable search input with icon, clear button, and keyboard handling
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
    it('renders with placeholder', () => {
        render(<SearchInput value="" onChange={() => { }} placeholder="Search items..." />);

        expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    });

    it('displays current value', () => {
        render(<SearchInput value="dragon" onChange={() => { }} />);

        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('dragon');
    });

    it('calls onChange when typing', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<SearchInput value="" onChange={handleChange} />);

        const input = screen.getByRole('textbox');
        await user.type(input, 'dragon');

        // Each keystroke triggers onChange with individual character added
        expect(handleChange).toHaveBeenCalled();
        expect(handleChange.mock.calls.length).toBeGreaterThanOrEqual(6);
        // Check that we got calls with progressive text
        const calls = handleChange.mock.calls.map(call => call[0]);
        expect(calls).toContain('d');
        expect(calls).toContain('n'); // Last character
    });

    it('shows search icon', () => {
        const { container } = render(<SearchInput value="" onChange={() => { }} />);

        // Search icon is rendered (lucide-react)
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
    });

    it('shows clear button when value is not empty', () => {
        render(<SearchInput value="dragon" onChange={() => { }} />);

        expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('does not show clear button when value is empty', () => {
        render(<SearchInput value="" onChange={() => { }} />);

        expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('clears value when clear button clicked', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<SearchInput value="dragon" onChange={handleChange} />);

        const clearButton = screen.getByLabelText('Clear search');
        await user.click(clearButton);

        expect(handleChange).toHaveBeenCalledWith('');
    });

    it('calls onFocus when focused', async () => {
        const user = userEvent.setup();
        const handleFocus = vi.fn();

        render(<SearchInput value="" onChange={() => { }} onFocus={handleFocus} />);

        const input = screen.getByRole('textbox');
        await user.click(input);

        expect(handleFocus).toHaveBeenCalled();
    });

    it('calls onBlur when blurred', async () => {
        const user = userEvent.setup();
        const handleBlur = vi.fn();

        render(<SearchInput value="" onChange={() => { }} onBlur={handleBlur} />);

        const input = screen.getByRole('textbox');
        await user.click(input);
        await user.tab(); // Focus out

        expect(handleBlur).toHaveBeenCalled();
    });

    it('calls onKeyDown on keyboard events', async () => {
        const user = userEvent.setup();
        const handleKeyDown = vi.fn();

        render(<SearchInput value="" onChange={() => { }} onKeyDown={handleKeyDown} />);

        const input = screen.getByRole('textbox');
        await user.type(input, '{ArrowDown}');

        expect(handleKeyDown).toHaveBeenCalled();
    });

    it('shows Ctrl+K hint when showShortcut is true', () => {
        render(<SearchInput value="" onChange={() => { }} placeholder="Search" showShortcut />);

        expect(screen.getByPlaceholderText('Search (Ctrl+K)')).toBeInTheDocument();
    });

    it('does not show Ctrl+K hint by default', () => {
        render(<SearchInput value="" onChange={() => { }} placeholder="Search" />);

        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Search (Ctrl+K)')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(
            <SearchInput value="" onChange={() => { }} className="custom-class" />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom inputClassName', () => {
        render(
            <SearchInput value="" onChange={() => { }} inputClassName="custom-input-class" />
        );

        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('custom-input-class');
    });

    it('supports ref forwarding', () => {
        const ref = { current: null };

        render(<SearchInput ref={ref} value="" onChange={() => { }} />);

        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('focuses input when ref.focus() is called', async () => {
        const ref = { current: null as HTMLInputElement | null };

        render(<SearchInput ref={ref} value="" onChange={() => { }} />);

        ref.current?.focus();

        expect(document.activeElement).toBe(ref.current);
    });

    it('sets id attribute', () => {
        render(<SearchInput value="" onChange={() => { }} id="search-input" />);

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('id', 'search-input');
    });

    it('sets name attribute', () => {
        render(<SearchInput value="" onChange={() => { }} name="search" />);

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('name', 'search');
    });

    it('sets aria-expanded for combobox', () => {
        render(<SearchInput value="" onChange={() => { }} aria-expanded={true} />);

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('sets aria-haspopup for combobox', () => {
        render(<SearchInput value="" onChange={() => { }} aria-haspopup="listbox" />);

        const input = screen.getByRole('combobox');
        expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('sets role="combobox" when aria-haspopup is listbox', () => {
        render(<SearchInput value="" onChange={() => { }} aria-haspopup="listbox" />);

        const input = screen.getByRole('combobox');
        expect(input).toBeInTheDocument();
    });

    it('does not set role="combobox" when aria-haspopup is not listbox', () => {
        render(<SearchInput value="" onChange={() => { }} />);

        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('handles rapid typing', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<SearchInput value="" onChange={handleChange} />);

        const input = screen.getByRole('textbox');
        await user.type(input, 'dragonsword', { delay: 0 });

        expect(handleChange).toHaveBeenCalledTimes(11);
    });

    it('clears with empty string callback', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<SearchInput value="test" onChange={handleChange} />);

        const input = screen.getByRole('textbox');
        await user.clear(input);

        expect(handleChange).toHaveBeenCalledWith('');
    });

    it('clear button has correct tabIndex', () => {
        render(<SearchInput value="dragon" onChange={() => { }} />);

        const clearButton = screen.getByLabelText('Clear search');
        expect(clearButton).toHaveAttribute('tabIndex', '-1');
    });

    it('search icon is not interactive', () => {
        const { container } = render(<SearchInput value="" onChange={() => { }} />);

        const iconContainer = container.querySelector('.pointer-events-none');
        expect(iconContainer).toBeInTheDocument();
    });
});

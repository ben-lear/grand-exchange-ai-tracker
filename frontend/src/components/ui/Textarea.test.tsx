/**
 * Textarea component tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
    describe('Rendering', () => {
        it('should render textarea element', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    placeholder="Enter text..."
                />
            );

            expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
        });

        it('should render with label when provided', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    label="Description"
                />
            );

            expect(screen.getByText('Description')).toBeInTheDocument();
        });

        it('should render required indicator when required prop is true', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    label="Description"
                    required
                />
            );

            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should render error message when error prop is provided', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    error="This field is required"
                />
            );

            expect(screen.getByText('This field is required')).toBeInTheDocument();
        });

        it('should render helper text when provided', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    helperText="Enter at least 10 characters"
                />
            );

            expect(screen.getByText('Enter at least 10 characters')).toBeInTheDocument();
        });

        it('should be disabled when disabled prop is true', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    disabled
                />
            );

            expect(screen.getByRole('textbox')).toBeDisabled();
        });

        it('should apply size variants', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    size="lg"
                />
            );

            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveClass('px-4', 'py-3', 'text-base');
        });
    });

    describe('Input handling', () => {
        it('should call onChange when text is entered', async () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    placeholder="Enter text..."
                />
            );

            const textarea = screen.getByPlaceholderText('Enter text...');
            await userEvent.type(textarea, 'Hello');

            expect(handleChange).toHaveBeenCalled();
        });

        it('should respect maxLength constraint', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    maxLength={10}
                />
            );

            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            expect(textarea.maxLength).toBe(10);
        });

        it('should display current text value', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value="Hello world"
                    onChange={handleChange}
                />
            );

            expect(screen.getByRole('textbox')).toHaveValue('Hello world');
        });
    });

    describe('Character Counter', () => {
        it('should show character count when showCount is true', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value="Hello"
                    onChange={handleChange}
                    showCount
                />
            );

            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('should show count with maxLength', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value="Hello"
                    onChange={handleChange}
                    showCount
                    maxLength={100}
                />
            );

            expect(screen.getByText('5/100')).toBeInTheDocument();
        });

        it('should update character count as user types', async () => {
            const handleChange = vi.fn();
            const { rerender } = render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    showCount
                />
            );

            expect(screen.getByText('0')).toBeInTheDocument();

            rerender(
                <Textarea
                    value="Hello world"
                    onChange={handleChange}
                    showCount
                />
            );

            expect(screen.getByText('11')).toBeInTheDocument();
        });
    });

    describe('Auto-resize', () => {
        it('should have overflow hidden when autoResize is true', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    autoResize
                />
            );

            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveClass('overflow-hidden');
        });

        it('should apply min and max height when autoResize is true', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    autoResize
                    minHeight={100}
                    maxHeight={300}
                />
            );

            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            expect(textarea.style.minHeight).toBe('100px');
            expect(textarea.style.maxHeight).toBe('300px');
        });
    });

    describe('Variants', () => {
        it('should apply default variant', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    variant="default"
                />
            );

            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveClass('bg-white');
            expect(textarea).toHaveClass('border-gray-300');
        });

        it('should apply error variant when error prop is provided', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    error="This field is required"
                />
            );

            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveClass('border-2');
            expect(textarea).toHaveClass('border-red-500');
        });

        it('should apply success variant', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    variant="success"
                />
            );

            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveClass('border-green-500');
        });
    });

    describe('Accessibility', () => {
        it('should have proper role', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                />
            );

            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('should be focusable', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                />
            );

            const textarea = screen.getByRole('textbox');
            textarea.focus();

            expect(textarea).toHaveFocus();
        });
    });

    describe('Size variants', () => {
        it('should apply sm size classes', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    size="sm"
                />
            );

            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveClass('px-2', 'py-1', 'text-sm');
        });

        it('should apply lg size classes', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    size="lg"
                />
            );

            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveClass('px-4', 'py-3', 'text-base');
        });
    });

    describe('Error handling', () => {
        it('should show error when provided', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    error="This field is required"
                />
            );

            expect(screen.getByText('This field is required')).toBeInTheDocument();
        });

        it('should prioritize error over helper text', () => {
            const handleChange = vi.fn();
            render(
                <Textarea
                    value=""
                    onChange={handleChange}
                    error="Error message"
                    helperText="Helper text"
                />
            );

            expect(screen.getByText('Error message')).toBeInTheDocument();
            expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
        });
    });
});

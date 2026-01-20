import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyboardShortcut } from '@/components/ui/KeyboardShortcut/KeyboardShortcut';

describe('KeyboardShortcut', () => {
    describe('Rendering', () => {
        it('should render single key', () => {
            render(<KeyboardShortcut keys="K" />);
            expect(screen.getByText('K')).toBeInTheDocument();
        });

        it('should render multiple keys', () => {
            render(<KeyboardShortcut keys={['Ctrl', 'K']} />);
            expect(screen.getByText(/Ctrl|⌘/)).toBeInTheDocument();
            expect(screen.getByText('K')).toBeInTheDocument();
        });

        it('should render separator between keys', () => {
            render(<KeyboardShortcut keys={['Ctrl', 'Shift', 'P']} />);
            const separators = screen.getAllByText('+');
            expect(separators).toHaveLength(2);
        });
    });

    describe('Key Mapping', () => {
        it('should map Enter key', () => {
            render(<KeyboardShortcut keys="Enter" />);
            expect(screen.getByText('↵')).toBeInTheDocument();
        });

        it('should map Escape key', () => {
            render(<KeyboardShortcut keys="Escape" />);
            expect(screen.getByText('Esc')).toBeInTheDocument();
        });

        it('should map Tab key', () => {
            render(<KeyboardShortcut keys="Tab" />);
            expect(screen.getByText('⇥')).toBeInTheDocument();
        });

        it('should map arrow keys', () => {
            const { rerender } = render(<KeyboardShortcut keys="ArrowUp" />);
            expect(screen.getByText('↑')).toBeInTheDocument();

            rerender(<KeyboardShortcut keys="ArrowDown" />);
            expect(screen.getByText('↓')).toBeInTheDocument();

            rerender(<KeyboardShortcut keys="ArrowLeft" />);
            expect(screen.getByText('←')).toBeInTheDocument();

            rerender(<KeyboardShortcut keys="ArrowRight" />);
            expect(screen.getByText('→')).toBeInTheDocument();
        });
    });

    describe('Size Variants', () => {
        it('should apply xs size', () => {
            const { container } = render(<KeyboardShortcut keys="K" size="xs" />);
            const kbd = container.querySelector('kbd');
            expect(kbd).toHaveClass('text-xs');
        });

        it('should apply sm size by default', () => {
            const { container } = render(<KeyboardShortcut keys="K" />);
            const kbd = container.querySelector('kbd');
            expect(kbd).toHaveClass('text-sm');
        });

        it('should apply md size', () => {
            const { container } = render(<KeyboardShortcut keys="K" size="md" />);
            const kbd = container.querySelector('kbd');
            expect(kbd).toHaveClass('text-base');
        });
    });

    describe('Variant Styles', () => {
        it('should apply default variant', () => {
            const { container } = render(<KeyboardShortcut keys="K" variant="default" />);
            const kbd = container.querySelector('kbd');
            expect(kbd).toBeInTheDocument();
        });

        it('should apply inline variant', () => {
            const { container } = render(<KeyboardShortcut keys="K" variant="inline" />);
            const kbd = container.querySelector('kbd');
            expect(kbd).toHaveClass('opacity-70');
        });
    });

    describe('Complex Shortcuts', () => {
        it('should render Ctrl+Shift+P', () => {
            render(<KeyboardShortcut keys={['Ctrl', 'Shift', 'P']} />);
            expect(screen.getByText(/Ctrl|⌘/)).toBeInTheDocument();
            expect(screen.getByText(/Shift|⇧/)).toBeInTheDocument();
            expect(screen.getByText('P')).toBeInTheDocument();
        });

        it('should render Alt+F4', () => {
            render(<KeyboardShortcut keys={['Alt', 'F', '4']} />);
            expect(screen.getByText(/Alt|⌥/)).toBeInTheDocument();
            expect(screen.getByText('F')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper aria-label', () => {
            render(<KeyboardShortcut keys={['Ctrl', 'K']} />);
            const kbd = screen.getByLabelText('Keyboard shortcut: Ctrl + K');
            expect(kbd).toBeInTheDocument();
        });

        it('should have proper aria-label for single key', () => {
            render(<KeyboardShortcut keys="Enter" />);
            const kbd = screen.getByLabelText('Keyboard shortcut: Enter');
            expect(kbd).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle unmapped keys', () => {
            render(<KeyboardShortcut keys="CustomKey" />);
            expect(screen.getByText('CustomKey')).toBeInTheDocument();
        });

        it('should handle empty string keys', () => {
            render(<KeyboardShortcut keys={['Ctrl', '', 'K']} />);
            // Should still render without errors
            expect(screen.getByText('K')).toBeInTheDocument();
        });
    });
});

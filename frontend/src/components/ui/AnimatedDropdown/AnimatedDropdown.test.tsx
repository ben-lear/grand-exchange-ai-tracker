/**
 * AnimatedDropdown component tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
    AnimatedDropdown,
    AnimatedDropdownDivider,
    AnimatedDropdownHeader,
    AnimatedDropdownItem,
    type AnimatedDropdownProps,
} from '@/components/ui/AnimatedDropdown/AnimatedDropdown';

const defaultProps: AnimatedDropdownProps = {
    isOpen: true,
    onClose: vi.fn(),
    trigger: <button>Open Menu</button>,
    children: (
        <>
            <AnimatedDropdownItem onClick={vi.fn()}>Option 1</AnimatedDropdownItem>
            <AnimatedDropdownItem onClick={vi.fn()}>Option 2</AnimatedDropdownItem>
        </>
    ),
};

describe('AnimatedDropdown', () => {
    it('should render trigger', () => {
        render(<AnimatedDropdown {...defaultProps} />);

        expect(screen.getByText('Open Menu')).toBeInTheDocument();
    });

    it('should show dropdown content when open', () => {
        render(<AnimatedDropdown {...defaultProps} isOpen={true} />);

        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should hide dropdown content when closed', () => {
        render(<AnimatedDropdown {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    describe('alignment', () => {
        it('should align right by default', () => {
            render(<AnimatedDropdown {...defaultProps} />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('right-0');
            expect(menu).toHaveClass('origin-top-right');
        });

        it('should align left when specified', () => {
            render(<AnimatedDropdown {...defaultProps} align="left" />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('left-0');
            expect(menu).toHaveClass('origin-top-left');
        });
    });

    describe('width', () => {
        it('should apply sm width by default', () => {
            render(<AnimatedDropdown {...defaultProps} />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('w-48');
        });

        it('should apply md width when specified', () => {
            render(<AnimatedDropdown {...defaultProps} width="md" />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('w-56');
        });

        it('should apply lg width when specified', () => {
            render(<AnimatedDropdown {...defaultProps} width="lg" />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('w-64');
        });

        it('should apply full width when specified', () => {
            render(<AnimatedDropdown {...defaultProps} width="full" />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('w-full');
        });
    });

    describe('maxHeight', () => {
        it('should apply default max height', () => {
            render(<AnimatedDropdown {...defaultProps} />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('max-h-80');
        });

        it('should apply custom max height', () => {
            render(<AnimatedDropdown {...defaultProps} maxHeight="max-h-40" />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('max-h-40');
        });
    });

    describe('custom classNames', () => {
        it('should apply custom className to menu', () => {
            render(<AnimatedDropdown {...defaultProps} className="custom-menu-class" />);

            const menu = screen.getByRole('menu');
            expect(menu).toHaveClass('custom-menu-class');
        });
    });
});

describe('AnimatedDropdownItem', () => {
    it('should render content', () => {
        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownItem onClick={vi.fn()}>Click Me</AnimatedDropdownItem>
            </AnimatedDropdown>
        );

        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should call onClick when clicked', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownItem onClick={onClick}>Click Me</AnimatedDropdownItem>
            </AnimatedDropdown>
        );

        await user.click(screen.getByText('Click Me'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownItem onClick={vi.fn()} disabled>
                    Disabled Item
                </AnimatedDropdownItem>
            </AnimatedDropdown>
        );

        const button = screen.getByText('Disabled Item');
        expect(button).toBeDisabled();
    });

    it('should not call onClick when disabled', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownItem onClick={onClick} disabled>
                    Disabled Item
                </AnimatedDropdownItem>
            </AnimatedDropdown>
        );

        await user.click(screen.getByText('Disabled Item'));

        expect(onClick).not.toHaveBeenCalled();
    });

    describe('variants', () => {
        it('should apply default styling', () => {
            render(
                <AnimatedDropdown {...defaultProps}>
                    <AnimatedDropdownItem onClick={vi.fn()}>Default</AnimatedDropdownItem>
                </AnimatedDropdown>
            );

            const button = screen.getByText('Default');
            expect(button).toHaveClass('text-gray-700');
        });

        it('should apply destructive styling', () => {
            render(
                <AnimatedDropdown {...defaultProps}>
                    <AnimatedDropdownItem onClick={vi.fn()} variant="destructive">
                        Delete
                    </AnimatedDropdownItem>
                </AnimatedDropdown>
            );

            const button = screen.getByText('Delete');
            expect(button).toHaveClass('text-red-600');
        });
    });

    it('should apply custom className', () => {
        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownItem onClick={vi.fn()} className="custom-item-class">
                    Custom
                </AnimatedDropdownItem>
            </AnimatedDropdown>
        );

        const button = screen.getByText('Custom');
        expect(button).toHaveClass('custom-item-class');
    });
});

describe('AnimatedDropdownDivider', () => {
    it('should render divider', () => {
        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownItem onClick={vi.fn()}>Item 1</AnimatedDropdownItem>
                <AnimatedDropdownDivider />
                <AnimatedDropdownItem onClick={vi.fn()}>Item 2</AnimatedDropdownItem>
            </AnimatedDropdown>
        );

        const divider = document.querySelector('.border-t');
        expect(divider).toBeInTheDocument();
        expect(divider).toHaveClass('border-gray-200');
    });
});

describe('AnimatedDropdownHeader', () => {
    it('should render header text', () => {
        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownHeader>Section Header</AnimatedDropdownHeader>
                <AnimatedDropdownItem onClick={vi.fn()}>Item</AnimatedDropdownItem>
            </AnimatedDropdown>
        );

        expect(screen.getByText('Section Header')).toBeInTheDocument();
    });

    it('should apply header styling', () => {
        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownHeader>Header</AnimatedDropdownHeader>
            </AnimatedDropdown>
        );

        const header = screen.getByText('Header');
        expect(header).toHaveClass('text-xs');
        expect(header).toHaveClass('font-medium');
        expect(header).toHaveClass('uppercase');
    });

    it('should apply custom className', () => {
        render(
            <AnimatedDropdown {...defaultProps}>
                <AnimatedDropdownHeader className="custom-header-class">
                    Header
                </AnimatedDropdownHeader>
            </AnimatedDropdown>
        );

        const header = screen.getByText('Header');
        expect(header).toHaveClass('custom-header-class');
    });
});

/**
 * Unit tests for Dropdown component
 * Tests dropdown container behavior including click-outside and rendering
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';

describe('Dropdown', () => {
    it('renders when isOpen is true', () => {
        render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText('Test item')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <Dropdown isOpen={false} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('renders children correctly', () => {
        render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
            </Dropdown>
        );

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
        const footer = <div>Loading...</div>;

        render(
            <Dropdown isOpen={true} onClose={() => { }} footer={footer}>
                <li>Test item</li>
            </Dropdown>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not render footer when not provided', () => {
        const { container } = render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        // Footer is rendered after ul, so check that ul is the last child
        const dropdownContainer = container.firstChild as HTMLElement;
        expect(dropdownContainer.children.length).toBe(1); // Only ul, no footer
    });

    it('calls onClose when clicking outside', async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        render(
            <div>
                <Dropdown isOpen={true} onClose={handleClose}>
                    <li>Test item</li>
                </Dropdown>
                <button>Outside button</button>
            </div>
        );

        const outsideButton = screen.getByRole('button');
        await user.click(outsideButton);

        expect(handleClose).toHaveBeenCalled();
    });

    it('does not call onClose when clicking inside dropdown', async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        render(
            <Dropdown isOpen={true} onClose={handleClose}>
                <li>Test item</li>
            </Dropdown>
        );

        const item = screen.getByText('Test item');
        await user.click(item);

        expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when clicking on footer', async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        const footer = <div>Footer content</div>;

        render(
            <Dropdown isOpen={true} onClose={handleClose} footer={footer}>
                <li>Test item</li>
            </Dropdown>
        );

        const footerElement = screen.getByText('Footer content');
        await user.click(footerElement);

        expect(handleClose).not.toHaveBeenCalled();
    });

    it('applies custom className', () => {
        const { container } = render(
            <Dropdown isOpen={true} onClose={() => { }} className="custom-dropdown">
                <li>Test item</li>
            </Dropdown>
        );

        expect(container.firstChild).toHaveClass('custom-dropdown');
    });

    it('applies default maxHeight', () => {
        render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveClass('max-h-80');
    });

    it('applies custom maxHeight', () => {
        render(
            <Dropdown isOpen={true} onClose={() => { }} maxHeight="max-h-96">
                <li>Test item</li>
            </Dropdown>
        );

        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveClass('max-h-96');
    });

    it('has correct ARIA role for listbox', () => {
        render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('accepts listRef for scroll control', () => {
        const ref = { current: null };

        render(
            <Dropdown isOpen={true} onClose={() => { }} listRef={ref}>
                <li>Test item</li>
            </Dropdown>
        );

        expect(ref.current).toBeInstanceOf(HTMLUListElement);
    });

    it('removes event listener on unmount', () => {
        const handleClose = vi.fn();
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

        const { unmount } = render(
            <Dropdown isOpen={true} onClose={handleClose}>
                <li>Test item</li>
            </Dropdown>
        );

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'mousedown',
            expect.any(Function)
        );
    });

    it('does not add event listener when closed', () => {
        const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

        render(
            <Dropdown isOpen={false} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('updates event listener when isOpen changes', async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        const { rerender } = render(
            <div>
                <Dropdown isOpen={false} onClose={handleClose}>
                    <li>Test item</li>
                </Dropdown>
                <button>Outside</button>
            </div>
        );

        // Click outside while closed - should not call onClose
        const outsideButton = screen.getByRole('button');
        await user.click(outsideButton);
        expect(handleClose).not.toHaveBeenCalled();

        // Open dropdown
        rerender(
            <div>
                <Dropdown isOpen={true} onClose={handleClose}>
                    <li>Test item</li>
                </Dropdown>
                <button>Outside</button>
            </div>
        );

        // Click outside while open - should call onClose
        await user.click(outsideButton);
        expect(handleClose).toHaveBeenCalled();
    });

    it('renders with overflow-y-auto for scrolling', () => {
        render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveClass('overflow-y-auto');
    });

    it('positions dropdown absolutely below trigger', () => {
        const { container } = render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        const dropdown = container.firstChild as HTMLElement;
        expect(dropdown).toHaveClass('absolute');
        expect(dropdown).toHaveClass('top-full');
    });

    it('has proper z-index for stacking', () => {
        const { container } = render(
            <Dropdown isOpen={true} onClose={() => { }}>
                <li>Test item</li>
            </Dropdown>
        );

        const dropdown = container.firstChild as HTMLElement;
        expect(dropdown).toHaveClass('z-50');
    });
});

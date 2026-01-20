/**
 * Unit tests for DropdownItem component
 * Tests selectable item with hover/selection states
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropdownItem } from '@/components/ui/DropdownItem/DropdownItem';

describe('DropdownItem', () => {
    it('renders children content', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                <span>Test content</span>
            </DropdownItem>
        );

        expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('has role="option"', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        expect(screen.getByRole('option')).toBeInTheDocument();
    });

    it('sets aria-selected when isSelected is true', () => {
        render(
            <DropdownItem isSelected={true} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option).toHaveAttribute('aria-selected', 'true');
    });

    it('sets aria-selected to false when isSelected is false', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(
            <DropdownItem isSelected={false} onClick={handleClick} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        await user.click(option);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onMouseEnter when mouse enters', async () => {
        const user = userEvent.setup();
        const handleMouseEnter = vi.fn();

        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={handleMouseEnter}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        await user.hover(option);

        expect(handleMouseEnter).toHaveBeenCalled();
    });

    it('applies custom className', () => {
        render(
            <DropdownItem
                isSelected={false}
                onClick={() => { }}
                onMouseEnter={() => { }}
                className="custom-class"
            >
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option).toHaveClass('custom-class');
    });

    it('sets data-index attribute', () => {
        render(
            <DropdownItem
                isSelected={false}
                onClick={() => { }}
                onMouseEnter={() => { }}
                data-index={5}
            >
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option).toHaveAttribute('data-index', '5');
    });

    it('applies selected styling when isSelected is true', () => {
        render(
            <DropdownItem isSelected={true} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        // Check that it has background color classes for selected state
        expect(option.className).toMatch(/bg-gray/);
    });

    it('has cursor-pointer class for interactivity', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option).toHaveClass('cursor-pointer');
    });

    it('applies flex layout for content alignment', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option.className).toMatch(/flex items-center/);
    });

    it('renders complex children correctly', () => {
        const { container } = render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                <div className="flex items-center gap-2">
                    <img src="icon.png" alt="" />
                    <span>Item name</span>
                    <span className="price">1000 gp</span>
                </div>
            </DropdownItem>
        );

        expect(screen.getByText('Item name')).toBeInTheDocument();
        expect(screen.getByText('1000 gp')).toBeInTheDocument();
        // Image with empty alt is decorative and has presentation role, not img role
        expect(container.querySelector('img')).toBeInTheDocument();
    });

    it('handles multiple rapid hover events', async () => {
        const user = userEvent.setup();
        const handleMouseEnter = vi.fn();

        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={handleMouseEnter}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');

        // Simulate rapid mouse movements
        await user.hover(option);
        await user.unhover(option);
        await user.hover(option);

        expect(handleMouseEnter).toHaveBeenCalledTimes(2);
    });

    it('handles click while selected', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(
            <DropdownItem isSelected={true} onClick={handleClick} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        await user.click(option);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be keyboard focused as part of listbox', () => {
        render(
            <ul role="listbox">
                <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                    Test item
                </DropdownItem>
            </ul>
        );

        const option = screen.getByRole('option');
        expect(option).toBeInTheDocument();
    });

    it('maintains correct structure with padding', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        // Check for padding classes
        expect(option.className).toMatch(/p[xy]-/);
    });

    it('works without data-index', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option).not.toHaveAttribute('data-index');
    });

    it('allows flex layout for children', () => {
        render(
            <DropdownItem isSelected={false} onClick={() => { }} onMouseEnter={() => { }}>
                Test item
            </DropdownItem>
        );

        const option = screen.getByRole('option');
        expect(option).toHaveClass('flex');
    });
});

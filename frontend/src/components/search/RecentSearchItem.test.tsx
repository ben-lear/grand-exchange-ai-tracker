/**
 * Unit tests for RecentSearchItem component
 * Tests rendering of recent searches with remove button
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RecentItem } from '../../hooks';
import { RecentSearchItem } from './RecentSearchItem';

describe('RecentSearchItem', () => {
    const mockRecentItem: RecentItem = {
        itemId: 1,
        name: 'Dragon scimitar',
        icon: 'https://example.com/dragon-scim.png',
    };

    it('renders item name', () => {
        render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);

        expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
    });

    it('renders clock icon', () => {
        const { container } = render(
            <RecentSearchItem item={mockRecentItem} onRemove={() => { }} />
        );

        // Clock icon from lucide-react
        const clockIcon = container.querySelector('svg');
        expect(clockIcon).toBeInTheDocument();
    });

    it('renders remove button', () => {
        render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);

        expect(
            screen.getByLabelText('Remove Dragon scimitar from recent')
        ).toBeInTheDocument();
    });

    it('calls onRemove with correct itemId when remove button is clicked', async () => {
        const user = userEvent.setup();
        const handleRemove = vi.fn();

        render(<RecentSearchItem item={mockRecentItem} onRemove={handleRemove} />);

        const removeButton = screen.getByLabelText('Remove Dragon scimitar from recent');
        await user.click(removeButton);

        expect(handleRemove).toHaveBeenCalledWith(1);
        expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation when remove button is clicked', async () => {
        const user = userEvent.setup();
        const handleRemove = vi.fn();
        const handleParentClick = vi.fn();

        render(
            <div onClick={handleParentClick}>
                <RecentSearchItem item={mockRecentItem} onRemove={handleRemove} />
            </div>
        );

        const removeButton = screen.getByLabelText('Remove Dragon scimitar from recent');
        await user.click(removeButton);

        expect(handleRemove).toHaveBeenCalled();
        expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('remove button has tabIndex -1', () => {
        render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);

        const removeButton = screen.getByLabelText('Remove Dragon scimitar from recent');
        expect(removeButton).toHaveAttribute('tabIndex', '-1');
    });

    it('renders X icon in remove button', () => {
        render(
            <RecentSearchItem item={mockRecentItem} onRemove={() => { }} />
        );

        // X icon should be in the button
        const button = screen.getByLabelText('Remove Dragon scimitar from recent');
        const xIcon = button.querySelector('svg');
        expect(xIcon).toBeInTheDocument();
    });

    it('truncates long item names', () => {
        const longNameItem: RecentItem = {
            itemId: 2,
            name: 'Very long item name that should be truncated properly',
        };

        render(<RecentSearchItem item={longNameItem} onRemove={() => { }} />);

        const nameElement = screen.getByText(
            'Very long item name that should be truncated properly'
        );
        expect(nameElement).toHaveClass('truncate');
    });

    it('has proper flex layout', () => {
        const { container } = render(
            <RecentSearchItem item={mockRecentItem} onRemove={() => { }} />
        );

        // RecentSearchItem renders a fragment with divs inside
        const mainContainer = container.querySelector('.flex.items-center.gap-2');
        expect(mainContainer).toBeInTheDocument();
    });

    it('clock icon has correct styling', () => {
        const { container } = render(
            <RecentSearchItem item={mockRecentItem} onRemove={() => { }} />
        );

        const clockIcon = container.querySelector('.text-gray-400');
        expect(clockIcon).toBeInTheDocument();
    });

    it('handles items without icon field', () => {
        const itemWithoutIcon: RecentItem = {
            itemId: 3,
            name: 'Abyssal whip',
        };

        render(<RecentSearchItem item={itemWithoutIcon} onRemove={() => { }} />);

        expect(screen.getByText('Abyssal whip')).toBeInTheDocument();
    });

    it('remove button has hover state', () => {
        render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);

        const removeButton = screen.getByLabelText('Remove Dragon scimitar from recent');
        // Check that the className string contains the hover class
        expect(removeButton.className).toContain('dark:hover:text-white');
    });

    it('handles multiple rapid clicks on remove button', async () => {
        const user = userEvent.setup();
        const handleRemove = vi.fn();

        render(<RecentSearchItem item={mockRecentItem} onRemove={handleRemove} />);

        const removeButton = screen.getByLabelText('Remove Dragon scimitar from recent');

        await user.click(removeButton);
        await user.click(removeButton);
        await user.click(removeButton);

        expect(handleRemove).toHaveBeenCalledTimes(3);
        expect(handleRemove).toHaveBeenCalledWith(1);
    });

    it('has accessible button label', () => {
        render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);

        const removeButton = screen.getByRole('button');
        expect(removeButton).toHaveAttribute(
            'aria-label',
            'Remove Dragon scimitar from recent'
        );
    });

    it('remove button is type="button"', () => {
        render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);

        const removeButton = screen.getByRole('button');
        expect(removeButton).toHaveAttribute('type', 'button');
    });

    it('renders complete layout with all elements', () => {
        render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);

        expect(screen.getByText('Dragon scimitar')).toBeInTheDocument();
        expect(screen.getByLabelText('Remove Dragon scimitar from recent')).toBeInTheDocument();

        const { container } = render(<RecentSearchItem item={mockRecentItem} onRemove={() => { }} />);
        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBe(2); // Clock icon + X icon
    });
});

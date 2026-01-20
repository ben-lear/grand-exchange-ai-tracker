/**
 * ActionMenu component tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Edit2, Share2, Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { ActionMenu, type ActionMenuItem, type ActionMenuProps } from './ActionMenu';

const createMockItems = (): ActionMenuItem[] => [
  { key: 'edit', label: 'Edit', icon: Edit2, onClick: vi.fn() },
  { key: 'share', label: 'Share', icon: Share2, onClick: vi.fn() },
  {
    key: 'delete',
    label: 'Delete',
    icon: Trash2,
    onClick: vi.fn(),
    variant: 'destructive',
    dividerBefore: true,
  },
];

const defaultProps: ActionMenuProps = {
  items: createMockItems(),
};

describe('ActionMenu', () => {
  it('should render menu button', () => {
    render(<ActionMenu {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('should open menu when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionMenu {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onClick when menu item is clicked', async () => {
    const user = userEvent.setup();
    const items = createMockItems();
    render(<ActionMenu items={items} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByText('Edit'));

    expect(items[0].onClick).toHaveBeenCalledTimes(1);
  });

  it('should render custom trigger', async () => {
    const user = userEvent.setup();
    render(
      <ActionMenu
        {...defaultProps}
        trigger={<span data-testid="custom-trigger">⋮</span>}
      />
    );

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should apply custom aria-label', () => {
    render(<ActionMenu {...defaultProps} ariaLabel="Actions for item" />);

    expect(screen.getByRole('button', { name: 'Actions for item' })).toBeInTheDocument();
  });

  describe('alignment', () => {
    it('should align right by default', async () => {
      const user = userEvent.setup();
      render(<ActionMenu {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('right-0');
    });

    it('should align left when specified', async () => {
      const user = userEvent.setup();
      render(<ActionMenu {...defaultProps} align="left" />);

      await user.click(screen.getByRole('button'));

      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('left-0');
    });
  });

  describe('dividers', () => {
    it('should render divider before item when dividerBefore is true', async () => {
      const user = userEvent.setup();
      render(<ActionMenu {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // The delete item has dividerBefore: true
      const dividers = document.querySelectorAll('.border-t');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  describe('destructive variant', () => {
    it('should apply destructive styling to delete item', async () => {
      const user = userEvent.setup();
      render(<ActionMenu {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const deleteButton = screen.getByText('Delete').closest('button');
      expect(deleteButton).toHaveClass('text-red-600');
    });
  });

  describe('disabled items', () => {
    it('should disable menu item when disabled is true', async () => {
      const user = userEvent.setup();
      const items: ActionMenuItem[] = [
        { key: 'disabled', label: 'Disabled Item', onClick: vi.fn(), disabled: true },
      ];

      render(<ActionMenu items={items} />);

      await user.click(screen.getByRole('button'));

      const disabledItem = screen.getByText('Disabled Item').closest('button');
      expect(disabledItem).toBeDisabled();
    });

    it('should not call onClick when disabled item is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const items: ActionMenuItem[] = [
        { key: 'disabled', label: 'Disabled Item', onClick, disabled: true },
      ];

      render(<ActionMenu items={items} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Disabled Item'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('stopPropagation', () => {
    it('should stop propagation when stopPropagation is true', async () => {
      const user = userEvent.setup();
      const parentClick = vi.fn();
      const items = createMockItems();

      render(
        <div onClick={parentClick}>
          <ActionMenu items={items} stopPropagation />
        </div>
      );

      await user.click(screen.getByRole('button'));

      // Parent click should not be called because stopPropagation is true
      expect(parentClick).not.toHaveBeenCalled();

      await user.click(screen.getByText('Edit'));

      expect(items[0].onClick).toHaveBeenCalled();
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('custom classNames', () => {
    it('should apply buttonClassName to button', () => {
      render(<ActionMenu {...defaultProps} buttonClassName="custom-button-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-button-class');
    });

    it('should apply menuClassName to menu', async () => {
      const user = userEvent.setup();
      render(<ActionMenu {...defaultProps} menuClassName="custom-menu-class" />);

      await user.click(screen.getByRole('button'));

      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('custom-menu-class');
    });
  });

  describe('icons', () => {
    it('should render icons for menu items', async () => {
      const user = userEvent.setup();
      render(<ActionMenu {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Each menu item should have an SVG icon
      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        const svg = item.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should render menu item without icon', async () => {
      const user = userEvent.setup();
      const items: ActionMenuItem[] = [
        { key: 'no-icon', label: 'No Icon Item', onClick: vi.fn() },
      ];

      render(<ActionMenu items={items} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('No Icon Item')).toBeInTheDocument();
    });
  });
});

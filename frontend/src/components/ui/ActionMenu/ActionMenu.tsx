/**
 * ActionMenu - Reusable dropdown action menu component
 *
 * Wraps HeadlessUI Menu with consistent styling for action dropdowns.
 * Reduces boilerplate in components like WatchlistCard.
 */

import { Icon } from '@/components/ui';
import { cn } from '@/utils';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';
import React, { Fragment } from 'react';

export interface ActionMenuItem {
  /** Unique identifier for the menu item */
  key: string;
  /** Display label for the menu item */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler for the menu item */
  onClick: () => void;
  /** Visual variant (default or destructive for dangerous actions) */
  variant?: 'default' | 'destructive';
  /** Whether the menu item is disabled */
  disabled?: boolean;
  /** Whether to show a divider before this item */
  dividerBefore?: boolean;
}

export interface ActionMenuProps {
  /** Array of menu items to display */
  items: ActionMenuItem[];
  /** Optional custom trigger element (defaults to MoreVertical icon) */
  trigger?: React.ReactNode;
  /** Alignment of the dropdown (default: right) */
  align?: 'left' | 'right';
  /** Additional className for the menu button */
  buttonClassName?: string;
  /** Additional className for the menu items container */
  menuClassName?: string;
  /** Aria label for the menu button */
  ariaLabel?: string;
  /** Stop propagation of click events (useful when inside clickable cards) */
  stopPropagation?: boolean;
}

/**
 * Dropdown action menu with consistent styling
 *
 * @example
 * ```tsx
 * <ActionMenu
 *   items={[
 *     { key: 'edit', label: 'Edit', icon: Edit2, onClick: handleEdit },
 *     { key: 'share', label: 'Share', icon: Share2, onClick: handleShare },
 *     { key: 'delete', label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive', dividerBefore: true },
 *   ]}
 *   stopPropagation
 * />
 * ```
 */
export function ActionMenu({
  items,
  trigger,
  align = 'right',
  buttonClassName,
  menuClassName,
  ariaLabel = 'Open menu',
  stopPropagation = false,
}: ActionMenuProps): React.ReactElement {
  const handleClick = (e: React.MouseEvent, onClick: () => void) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    onClick();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={cn(
          'p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors',
          buttonClassName
        )}
        onClick={handleButtonClick}
        aria-label={ariaLabel}
      >
        {trigger || <Icon as={MoreVertical} size="sm" color="muted" />}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          <div className="py-1">
            {items.map((item) => (
              <Fragment key={item.key}>
                {item.dividerBefore && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                )}
                <Menu.Item disabled={item.disabled}>
                  {({ active, disabled }) => (
                    <button
                      onClick={(e) => handleClick(e, item.onClick)}
                      disabled={disabled}
                      className={cn(
                        'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors',
                        item.variant === 'destructive'
                          ? cn(
                            'text-red-600 dark:text-red-400',
                            active && 'bg-red-50 dark:bg-red-900/20'
                          )
                          : cn(
                            'text-gray-700 dark:text-gray-300',
                            active && 'bg-gray-100 dark:bg-gray-700'
                          ),
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {item.icon && (
                        <item.icon
                          className={cn(
                            'w-4 h-4',
                            item.variant === 'destructive'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                          )}
                        />
                      )}
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              </Fragment>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

/**
 * ActionMenu Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Download, Edit2, MoreHorizontal, Share2, Star, Trash2 } from 'lucide-react';
import { ActionMenu, type ActionMenuItem } from './ActionMenu';
import { Icon } from './Icon';

const meta: Meta<typeof ActionMenu> = {
    title: 'UI/ActionMenu',
    component: ActionMenu,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A reusable dropdown action menu component. Reduces boilerplate for three-dot menus commonly used in cards and list items.',
            },
        },
    },
    argTypes: {
        align: {
            control: 'select',
            options: ['left', 'right'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof ActionMenu>;

const defaultItems: ActionMenuItem[] = [
    { key: 'edit', label: 'Edit', icon: Edit2, onClick: () => alert('Edit clicked') },
    { key: 'share', label: 'Share', icon: Share2, onClick: () => alert('Share clicked') },
    { key: 'download', label: 'Download', icon: Download, onClick: () => alert('Download clicked') },
];

/**
 * Default action menu with common actions
 */
export const Default: Story = {
    args: {
        items: defaultItems,
    },
};

/**
 * Menu with destructive action
 */
export const WithDestructiveAction: Story = {
    args: {
        items: [
            ...defaultItems,
            {
                key: 'delete',
                label: 'Delete',
                icon: Trash2,
                onClick: () => alert('Delete clicked'),
                variant: 'destructive',
                dividerBefore: true,
            },
        ],
    },
};

/**
 * Menu with disabled items
 */
export const WithDisabledItems: Story = {
    args: {
        items: [
            { key: 'edit', label: 'Edit', icon: Edit2, onClick: () => { }, disabled: true },
            { key: 'share', label: 'Share', icon: Share2, onClick: () => alert('Share clicked') },
            { key: 'download', label: 'Download', icon: Download, onClick: () => { }, disabled: true },
        ],
    },
};

/**
 * Menu with custom trigger
 */
export const CustomTrigger: Story = {
    args: {
        items: defaultItems,
        trigger: <Icon as={MoreHorizontal} size="md" color="primary" />,
    },
};

/**
 * Menu with text trigger
 */
export const TextTrigger: Story = {
    args: {
        items: defaultItems,
        trigger: (
            <span className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Actions ▾
            </span>
        ),
    },
};

/**
 * Left-aligned menu
 */
export const LeftAligned: Story = {
    args: {
        items: defaultItems,
        align: 'left',
    },
    decorators: [
        (Story) => (
            <div className="flex justify-end pr-48">
                <Story />
            </div>
        ),
    ],
};

/**
 * Menu without icons
 */
export const WithoutIcons: Story = {
    args: {
        items: [
            { key: 'edit', label: 'Edit', onClick: () => alert('Edit clicked') },
            { key: 'duplicate', label: 'Duplicate', onClick: () => alert('Duplicate clicked') },
            { key: 'archive', label: 'Archive', onClick: () => alert('Archive clicked') },
        ],
    },
};

/**
 * Menu with sections (dividers)
 */
export const WithSections: Story = {
    args: {
        items: [
            { key: 'favorite', label: 'Add to favorites', icon: Star, onClick: () => { } },
            { key: 'edit', label: 'Edit', icon: Edit2, onClick: () => { }, dividerBefore: true },
            { key: 'share', label: 'Share', icon: Share2, onClick: () => { } },
            { key: 'download', label: 'Download', icon: Download, onClick: () => { } },
            {
                key: 'delete',
                label: 'Delete',
                icon: Trash2,
                onClick: () => { },
                variant: 'destructive',
                dividerBefore: true,
            },
        ],
    },
};

/**
 * Menu inside a clickable card (with stopPropagation)
 */
export const InsideClickableCard: Story = {
    render: () => (
        <div
            onClick={() => alert('Card clicked')}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Card Title</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click the card or the menu. The menu should not trigger the card click.
                    </p>
                </div>
                <ActionMenu
                    items={[
                        { key: 'edit', label: 'Edit', icon: Edit2, onClick: () => alert('Edit clicked') },
                        { key: 'delete', label: 'Delete', icon: Trash2, onClick: () => alert('Delete clicked'), variant: 'destructive' },
                    ]}
                    stopPropagation
                />
            </div>
        </div>
    ),
};

/**
 * Multiple menus in a list
 */
export const InList: Story = {
    render: () => (
        <div className="space-y-2">
            {['Item 1', 'Item 2', 'Item 3'].map((item) => (
                <div
                    key={item}
                    className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded"
                >
                    <span className="text-gray-900 dark:text-gray-100">{item}</span>
                    <ActionMenu
                        items={[
                            { key: 'edit', label: 'Edit', icon: Edit2, onClick: () => alert(`Edit ${item}`) },
                            { key: 'delete', label: 'Delete', icon: Trash2, onClick: () => alert(`Delete ${item}`), variant: 'destructive' },
                        ]}
                        ariaLabel={`Actions for ${item}`}
                    />
                </div>
            ))}
        </div>
    ),
};

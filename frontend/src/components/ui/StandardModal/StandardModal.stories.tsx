/**
 * StandardModal Storybook stories
 */

import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { StandardModal } from '@/components/ui/StandardModal/StandardModal';
import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, FolderPlus, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof StandardModal> = {
    title: 'UI/StandardModal',
    component: StandardModal,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A reusable modal wrapper with consistent styling, animations, and accessibility. Reduces modal boilerplate by ~80 lines.',
            },
        },
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        iconColor: {
            control: 'select',
            options: ['default', 'primary', 'success', 'warning', 'error'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof StandardModal>;

/**
 * Basic modal with title and content
 */
export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Modal Title',
        children: (
            <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                    This is the modal content. You can put any content here including forms,
                    text, images, or other components.
                </p>
            </div>
        ),
    },
};

/**
 * Modal with icon in the header
 */
export const WithIcon: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Create Watchlist',
        icon: FolderPlus,
        iconColor: 'primary',
        children: (
            <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                    Enter a name for your new watchlist.
                </p>
                <Input placeholder="Watchlist name..." />
            </div>
        ),
    },
};

/**
 * Modal with footer containing action buttons
 */
export const WithFooter: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Confirm Action',
        icon: Settings,
        iconColor: 'default',
        children: (
            <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to proceed with this action? This cannot be undone.
            </p>
        ),
        footer: (
            <div className="flex gap-3 justify-end">
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Confirm</Button>
            </div>
        ),
    },
};

/**
 * Destructive/warning modal
 */
export const Destructive: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Delete Watchlist',
        icon: Trash2,
        iconColor: 'error',
        children: (
            <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete "My Watchlist"? This action cannot be undone
                and all items in the watchlist will be removed.
            </p>
        ),
        footer: (
            <div className="flex gap-3 justify-end">
                <Button variant="secondary">Cancel</Button>
                <Button variant="destructive">Delete</Button>
            </div>
        ),
    },
};

/**
 * Warning modal
 */
export const Warning: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Unsaved Changes',
        icon: AlertTriangle,
        iconColor: 'warning',
        children: (
            <p className="text-gray-600 dark:text-gray-300">
                You have unsaved changes. Do you want to save them before leaving?
            </p>
        ),
        footer: (
            <div className="flex gap-3 justify-end">
                <Button variant="secondary">Discard</Button>
                <Button variant="primary">Save Changes</Button>
            </div>
        ),
    },
};

/**
 * Modal without close button
 */
export const WithoutCloseButton: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Read Only Notice',
        showCloseButton: false,
        children: (
            <p className="text-gray-600 dark:text-gray-300">
                This modal hides the header close button to force an explicit action.
            </p>
        ),
        footer: (
            <div className="flex gap-3 justify-end">
                <Button variant="primary">Acknowledge</Button>
            </div>
        ),
    },
};

/**
 * All available sizes
 */
export const AllSizes: Story = {
    render: () => {
        const sizes = ['sm', 'md', 'lg', 'xl', '2xl'] as const;
        const [openSize, setOpenSize] = useState<(typeof sizes)[number] | null>(null);

        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click a button to open modal in that size:
                </p>
                <div className="flex gap-2 flex-wrap">
                    {sizes.map((size) => (
                        <Button key={size} onClick={() => setOpenSize(size)}>
                            {size.toUpperCase()}
                        </Button>
                    ))}
                </div>

                {sizes.map((size) => (
                    <StandardModal
                        key={size}
                        isOpen={openSize === size}
                        onClose={() => setOpenSize(null)}
                        title={`${size.toUpperCase()} Modal`}
                        size={size}
                    >
                        <p className="text-gray-600 dark:text-gray-300">
                            This is a {size} sized modal. It has a max-width of max-w-{size}.
                        </p>
                    </StandardModal>
                ))}
            </div>
        );
    },
};

/**
 * Modal with form content
 */
export const FormModal: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Edit Profile',
        size: 'md',
        children: (
            <form className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Display Name
                    </label>
                    <Input defaultValue="John Doe" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                    </label>
                    <Input type="email" defaultValue="john@example.com" />
                </div>
            </form>
        ),
        footer: (
            <div className="flex gap-3 justify-end">
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Save Changes</Button>
            </div>
        ),
    },
};

/**
 * Modal with scrollable content
 */
export const ScrollableContent: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        title: 'Terms of Service',
        size: 'lg',
        children: (
            <div className="max-h-64 overflow-y-auto">
                {Array.from({ length: 20 }, (_, i) => (
                    <p key={i} className="mb-4 text-gray-600 dark:text-gray-300">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                        veniam, quis nostrud exercitation ullamco laboris.
                    </p>
                ))}
            </div>
        ),
        footer: (
            <div className="flex gap-3 justify-end">
                <Button variant="secondary">Decline</Button>
                <Button variant="primary">Accept</Button>
            </div>
        ),
    },
};

/**
 * Interactive example with open/close state
 */
export const Interactive: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div>
                <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

                <StandardModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Interactive Modal"
                    icon={FolderPlus}
                    iconColor="primary"
                    footer={
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => setIsOpen(false)}>
                                Confirm
                            </Button>
                        </div>
                    }
                >
                    <p className="text-gray-600 dark:text-gray-300">
                        This modal can be opened and closed interactively. Try clicking the
                        buttons or pressing Escape.
                    </p>
                </StandardModal>
            </div>
        );
    },
};

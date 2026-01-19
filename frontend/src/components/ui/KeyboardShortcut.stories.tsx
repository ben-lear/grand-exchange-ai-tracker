import type { Meta, StoryObj } from '@storybook/react';
import { KeyboardShortcut } from './KeyboardShortcut';

const meta: Meta<typeof KeyboardShortcut> = {
    title: 'UI/KeyboardShortcut',
    component: KeyboardShortcut,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'KeyboardShortcut component for displaying keyboard shortcuts with platform-aware key mapping (Mac vs Windows/Linux).',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        keys: {
            control: 'text',
            description: 'Key or array of keys',
        },
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md'],
        },
        variant: {
            control: 'select',
            options: ['default', 'inline'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof KeyboardShortcut>;

export const SingleKey: Story = {
    args: {
        keys: 'K',
    },
};

export const CtrlK: Story = {
    args: {
        keys: ['Ctrl', 'K'],
    },
    parameters: {
        docs: {
            description: {
                story: 'Displays as Ctrl+K on Windows/Linux and ⌘K on Mac.',
            },
        },
    },
};

export const CmdShiftP: Story = {
    args: {
        keys: ['Cmd', 'Shift', 'P'],
    },
};

export const SpecialKeys: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600">Enter:</span>
                <KeyboardShortcut keys="Enter" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600">Escape:</span>
                <KeyboardShortcut keys="Escape" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600">Tab:</span>
                <KeyboardShortcut keys="Tab" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600">Arrows:</span>
                <KeyboardShortcut keys={['ArrowUp', 'ArrowDown']} />
            </div>
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <span className="w-20 text-sm text-gray-600">XS:</span>
                <KeyboardShortcut keys={['Ctrl', 'K']} size="xs" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-20 text-sm text-gray-600">SM:</span>
                <KeyboardShortcut keys={['Ctrl', 'K']} size="sm" />
            </div>
            <div className="flex items-center gap-4">
                <span className="w-20 text-sm text-gray-600">MD:</span>
                <KeyboardShortcut keys={['Ctrl', 'K']} size="md" />
            </div>
        </div>
    ),
};

export const InlineVariant: Story = {
    render: () => (
        <p className="text-sm text-gray-600 dark:text-gray-400">
            Press <KeyboardShortcut keys={['Ctrl', 'K']} variant="inline" /> to open search
        </p>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Inline variant for use within text.',
            },
        },
    },
};

export const CommonShortcuts: Story = {
    render: () => (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-700 dark:text-gray-300">Open search</span>
                <KeyboardShortcut keys={['Ctrl', 'K']} />
            </div>
            <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-700 dark:text-gray-300">Close dialog</span>
                <KeyboardShortcut keys="Escape" />
            </div>
            <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-700 dark:text-gray-300">Submit form</span>
                <KeyboardShortcut keys="Enter" />
            </div>
            <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-700 dark:text-gray-300">Navigate items</span>
                <KeyboardShortcut keys={['ArrowUp', 'ArrowDown']} />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Common keyboard shortcuts displayed in a help menu style.',
            },
        },
    },
};

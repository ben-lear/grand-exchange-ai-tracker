/**
 * AnimatedDropdown Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ChevronDown, Settings, User } from 'lucide-react';
import { useState } from 'react';
import {
    AnimatedDropdown,
    AnimatedDropdownDivider,
    AnimatedDropdownHeader,
    AnimatedDropdownItem,
} from './AnimatedDropdown';
import { Button } from './Button';
import { Icon } from './Icon';

const meta: Meta<typeof AnimatedDropdown> = {
    title: 'UI/AnimatedDropdown',
    component: AnimatedDropdown,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'An animated dropdown wrapper using HeadlessUI transitions. Provides consistent dropdown animations and styling.',
            },
        },
    },
    argTypes: {
        align: {
            control: 'select',
            options: ['left', 'right'],
        },
        width: {
            control: 'select',
            options: ['auto', 'sm', 'md', 'lg', 'full'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof AnimatedDropdown>;

/**
 * Default animated dropdown
 */
export const Default: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <AnimatedDropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                trigger={
                    <Button onClick={() => setIsOpen(!isOpen)}>
                        Options <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                }
            >
                <AnimatedDropdownItem onClick={() => alert('Option 1')}>
                    Option 1
                </AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => alert('Option 2')}>
                    Option 2
                </AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => alert('Option 3')}>
                    Option 3
                </AnimatedDropdownItem>
            </AnimatedDropdown>
        );
    },
};

/**
 * Dropdown with icons
 */
export const WithIcons: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <AnimatedDropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                trigger={
                    <Button onClick={() => setIsOpen(!isOpen)}>
                        <Icon as={User} size="sm" className="mr-2" />
                        Profile
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                }
            >
                <AnimatedDropdownItem onClick={() => { }}>
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Profile
                    </div>
                </AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => { }}>
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </div>
                </AnimatedDropdownItem>
            </AnimatedDropdown>
        );
    },
};

/**
 * Dropdown with sections and headers
 */
export const WithSections: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <AnimatedDropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                trigger={
                    <Button onClick={() => setIsOpen(!isOpen)}>
                        Menu <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                }
                width="md"
            >
                <AnimatedDropdownHeader>Account</AnimatedDropdownHeader>
                <AnimatedDropdownItem onClick={() => { }}>Profile</AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => { }}>Settings</AnimatedDropdownItem>

                <AnimatedDropdownDivider />

                <AnimatedDropdownHeader>Actions</AnimatedDropdownHeader>
                <AnimatedDropdownItem onClick={() => { }}>New Watchlist</AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => { }}>Import Data</AnimatedDropdownItem>

                <AnimatedDropdownDivider />

                <AnimatedDropdownItem onClick={() => { }} variant="destructive">
                    Sign Out
                </AnimatedDropdownItem>
            </AnimatedDropdown>
        );
    },
};

/**
 * Dropdown with disabled items
 */
export const WithDisabledItems: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <AnimatedDropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                trigger={
                    <Button onClick={() => setIsOpen(!isOpen)}>
                        Actions <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                }
            >
                <AnimatedDropdownItem onClick={() => { }}>Edit</AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => { }} disabled>
                    Delete (Disabled)
                </AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => { }}>Share</AnimatedDropdownItem>
            </AnimatedDropdown>
        );
    },
};

/**
 * Left-aligned dropdown
 */
export const LeftAligned: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="flex justify-end pr-48">
                <AnimatedDropdown
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    trigger={
                        <Button onClick={() => setIsOpen(!isOpen)}>
                            Left Aligned <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    }
                    align="left"
                >
                    <AnimatedDropdownItem onClick={() => { }}>Option 1</AnimatedDropdownItem>
                    <AnimatedDropdownItem onClick={() => { }}>Option 2</AnimatedDropdownItem>
                    <AnimatedDropdownItem onClick={() => { }}>Option 3</AnimatedDropdownItem>
                </AnimatedDropdown>
            </div>
        );
    },
};

/**
 * Different widths
 */
export const DifferentWidths: Story = {
    render: () => {
        const [openDropdown, setOpenDropdown] = useState<string | null>(null);

        const widths = ['auto', 'sm', 'md', 'lg'] as const;

        return (
            <div className="flex gap-4 flex-wrap">
                {widths.map((width) => (
                    <AnimatedDropdown
                        key={width}
                        isOpen={openDropdown === width}
                        onClose={() => setOpenDropdown(null)}
                        trigger={
                            <Button onClick={() => setOpenDropdown(width)}>
                                {width} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        }
                        width={width}
                    >
                        <AnimatedDropdownItem onClick={() => { }}>
                            This is a {width} width dropdown
                        </AnimatedDropdownItem>
                        <AnimatedDropdownItem onClick={() => { }}>Option 2</AnimatedDropdownItem>
                    </AnimatedDropdown>
                ))}
            </div>
        );
    },
};

/**
 * Dropdown with scrollable content
 */
export const ScrollableContent: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);

        return (
            <AnimatedDropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                trigger={
                    <Button onClick={() => setIsOpen(!isOpen)}>
                        Long List <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                }
                maxHeight="max-h-48"
            >
                {items.map((item) => (
                    <AnimatedDropdownItem key={item} onClick={() => { }}>
                        {item}
                    </AnimatedDropdownItem>
                ))}
            </AnimatedDropdown>
        );
    },
};

/**
 * Destructive variant items
 */
export const DestructiveItems: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <AnimatedDropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                trigger={
                    <Button onClick={() => setIsOpen(!isOpen)}>
                        Danger Zone <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                }
            >
                <AnimatedDropdownItem onClick={() => { }}>Edit</AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => { }}>Duplicate</AnimatedDropdownItem>
                <AnimatedDropdownDivider />
                <AnimatedDropdownItem onClick={() => { }} variant="destructive">
                    Delete permanently
                </AnimatedDropdownItem>
                <AnimatedDropdownItem onClick={() => { }} variant="destructive">
                    Reset all data
                </AnimatedDropdownItem>
            </AnimatedDropdown>
        );
    },
};

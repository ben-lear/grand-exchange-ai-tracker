/**
 * ToggleButton component stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Bell, Pin, Star } from 'lucide-react';
import { useState } from 'react';
import { ToggleButton } from './ToggleButton';

const meta: Meta<typeof ToggleButton> = {
    title: 'UI/ToggleButton',
    component: ToggleButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        activeColor: {
            control: 'select',
            options: ['blue', 'yellow', 'green', 'red', 'purple'],
        },
        inactiveColor: {
            control: 'select',
            options: ['gray', 'muted'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
    args: {
        icon: Star,
        isActive: false,
        onToggle: () => { },
        label: 'Favorite',
    },
};

export const Active: Story = {
    args: {
        icon: Star,
        isActive: true,
        onToggle: () => { },
        label: 'Favorite',
        activeColor: 'yellow',
    },
};

export const Interactive: Story = {
    render: () => {
        const [isActive, setIsActive] = useState(false);

        return (
            <div className="flex items-center gap-4">
                <ToggleButton
                    icon={Pin}
                    isActive={isActive}
                    onToggle={setIsActive}
                    label="Pin"
                    tooltip={isActive ? 'Unpin' : 'Pin'}
                />
                <ToggleButton
                    icon={Bell}
                    isActive={isActive}
                    onToggle={setIsActive}
                    label="Notify"
                    activeColor="green"
                    tooltip={isActive ? 'Disable' : 'Enable'}
                />
            </div>
        );
    },
};

import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ItemDisplay } from './ItemDisplay';

const meta: Meta<typeof ItemDisplay> = {
    title: 'Item/ItemDisplay',
    component: ItemDisplay,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BrowserRouter>
                <Story />
            </BrowserRouter>
        ),
    ],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ItemDisplay>;

const mockItem = {
    id: 1,
    itemId: 2,
    name: 'Cannonball',
    description: 'Ammo for the Dwarf Multicannon.',
    iconUrl: 'https://oldschool.runescape.wiki/images/Cannonball.png',
    members: false,
    buyLimit: 11000,
    highAlch: 5,
    lowAlch: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
};

const mockMembersItem = {
    id: 2,
    itemId: 4151,
    name: 'Abyssal whip',
    description: 'A weapon from the abyss.',
    iconUrl: 'https://oldschool.runescape.wiki/images/Abyssal_whip.png',
    members: true,
    buyLimit: 70,
    highAlch: 72000,
    lowAlch: 48000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
};

export const Default: Story = {
    args: {
        item: mockItem,
    },
};

export const WithID: Story = {
    args: {
        item: mockItem,
        showId: true,
    },
};

export const WithBadge: Story = {
    args: {
        item: mockMembersItem,
        showBadges: true,
    },
};

export const AsLink: Story = {
    args: {
        item: mockItem,
        showLink: true,
    },
};

export const AllOptions: Story = {
    args: {
        item: mockMembersItem,
        showId: true,
        showLink: true,
        showBadges: true,
    },
};

export const SizeXS: Story = {
    args: {
        item: mockItem,
        size: 'xs',
        showId: true,
    },
};

export const SizeSM: Story = {
    args: {
        item: mockItem,
        size: 'sm',
        showId: true,
    },
};

export const SizeMD: Story = {
    args: {
        item: mockItem,
        size: 'md',
        showId: true,
    },
};

export const SizeLG: Story = {
    args: {
        item: mockItem,
        size: 'lg',
        showId: true,
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">Extra Small (xs)</h3>
                <ItemDisplay item={mockItem} size="xs" showId={true} />
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Small (sm)</h3>
                <ItemDisplay item={mockItem} size="sm" showId={true} />
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Medium (md) - Default</h3>
                <ItemDisplay item={mockItem} size="md" showId={true} />
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Large (lg)</h3>
                <ItemDisplay item={mockItem} size="lg" showId={true} />
            </div>
        </div>
    ),
};

export const LongItemName: Story = {
    args: {
        item: {
            ...mockItem,
            name: '3rd age platebody (shadow)',
        },
        showId: true,
        showBadges: true,
    },
};

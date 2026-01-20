import type { Meta, StoryObj } from '@storybook/react';
import { ItemHeader } from './ItemHeader';

const meta: Meta<typeof ItemHeader> = {
    title: 'Item/ItemHeader',
    component: ItemHeader,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ItemHeader>;

export const Default: Story = {
    args: {
        item: {
            id: 1,
            itemId: 2,
            name: 'Cannonball',
            description: 'Ammo for the Dwarf Multicannon.',
            iconUrl: 'https://oldschool.runescape.wiki/images/Cannonball.png',
            members: false,
            buyLimit: 11000,
            highAlch: 4,
            lowAlch: 2,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        },
    },
};

export const MembersItem: Story = {
    args: {
        item: {
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
        },
    },
};

export const LongDescription: Story = {
    args: {
        item: {
            id: 3,
            itemId: 11802,
            name: 'Armadyl godsword',
            description:
                'An enormous sword. This is a very long description that tests how the component handles multiple lines of text. It should wrap properly and maintain good readability even with extensive content.',
            iconUrl: 'https://oldschool.runescape.wiki/images/Armadyl_godsword.png',
            members: true,
            buyLimit: 10,
            highAlch: 300000,
            lowAlch: 200000,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        },
    },
};

export const NoDescription: Story = {
    args: {
        item: {
            id: 4,
            itemId: 995,
            name: 'Coins',
            description: '',
            iconUrl: 'https://oldschool.runescape.wiki/images/Coins_1000.png',
            members: false,
            buyLimit: 0,
            highAlch: 1,
            lowAlch: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        },
    },
};

export const WithoutIcon: Story = {
    args: {
        item: {
            id: 5,
            itemId: 1234,
            name: 'Unknown Item',
            description: 'An item without an icon URL.',
            iconUrl: '',
            members: false,
            buyLimit: 100,
            highAlch: 10,
            lowAlch: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        },
    },
};

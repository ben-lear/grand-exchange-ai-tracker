import type { Meta, StoryObj } from '@storybook/react';
import { ItemMetadata } from './ItemMetadata';

const meta: Meta<typeof ItemMetadata> = {
    title: 'Item/ItemMetadata',
    component: ItemMetadata,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ItemMetadata>;

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
            highAlch: 5,
            lowAlch: 3,
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

export const HighBuyLimit: Story = {
    args: {
        item: {
            id: 3,
            itemId: 561,
            name: 'Nature rune',
            description: 'Used for high level alchemy and other nature spells.',
            iconUrl: 'https://oldschool.runescape.wiki/images/Nature_rune.png',
            members: false,
            buyLimit: 25000,
            highAlch: 144,
            lowAlch: 96,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        },
    },
};

export const NoBuyLimit: Story = {
    args: {
        item: {
            id: 4,
            itemId: 995,
            name: 'Coins',
            description: 'Lovely money!',
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

export const NoAlchemyValues: Story = {
    args: {
        item: {
            id: 5,
            itemId: 1234,
            name: 'Untradeable Item',
            description: 'Cannot be alchemized.',
            iconUrl: '',
            members: true,
            buyLimit: 0,
            highAlch: 0,
            lowAlch: 0,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        },
    },
};

export const HighValueItem: Story = {
    args: {
        item: {
            id: 6,
            itemId: 11802,
            name: 'Armadyl godsword',
            description: 'An enormous sword.',
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

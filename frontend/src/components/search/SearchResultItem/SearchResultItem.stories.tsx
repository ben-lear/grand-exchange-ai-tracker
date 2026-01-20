import type { Meta, StoryObj } from '@storybook/react';
import { SearchResultItem } from './SearchResultItem';

const meta = {
    title: 'Search/SearchResultItem',
    component: SearchResultItem,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof SearchResultItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        item: {
            id: 1,
            itemId: 4151,
            name: 'Abyssal whip',
            description: 'A weapon from the abyss.',
            iconUrl: 'https://oldschool.runescape.wiki/images/thumb/Abyssal_whip.png/120px-Abyssal_whip.png',
            members: true,
            buyLimit: 70,
            highAlch: 72000,
            lowAlch: 48000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    }
};

export const Compact: Story = {
    args: {
        item: {
            id: 2,
            itemId: 995,
            name: 'Coins',
            description: 'Gold currency used by adventurers.',
            iconUrl: 'https://oldschool.runescape.wiki/images/thumb/Coins_10000.png/120px-Coins_10000.png',
            members: false,
            buyLimit: 0,
            highAlch: 0,
            lowAlch: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    },
};

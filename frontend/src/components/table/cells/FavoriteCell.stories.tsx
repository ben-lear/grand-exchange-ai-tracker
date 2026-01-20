import type { Meta, StoryObj } from '@storybook/react';
import { FavoriteCell } from './FavoriteCell';

const meta = {
    title: 'Table/Cells/FavoriteCell',
    component: FavoriteCell,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof FavoriteCell>;

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

export const AnotherItem: Story = {
    args: {
        item: {
            id: 2,
            itemId: 11840,
            name: 'Dragon boots',
            description: 'A sturdy pair of boots.',
            iconUrl: 'https://oldschool.runescape.wiki/images/thumb/Dragon_boots.png/120px-Dragon_boots.png',
            members: true,
            buyLimit: 0,
            highAlch: 0,
            lowAlch: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    },
};

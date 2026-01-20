import type { Meta, StoryObj } from '@storybook/react';
import { WatchlistCell } from './WatchlistCell';

const meta = {
    title: 'Table/Cells/WatchlistCell',
    component: WatchlistCell,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof WatchlistCell>;

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

export const FreeToPlayItem: Story = {
    args: {
        item: {
            id: 2,
            itemId: 1511,
            name: 'Logs',
            description: 'Logs from a normal tree.',
            iconUrl: 'https://oldschool.runescape.wiki/images/thumb/Logs.png/120px-Logs.png',
            members: false,
            buyLimit: 0,
            highAlch: 0,
            lowAlch: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    },
};

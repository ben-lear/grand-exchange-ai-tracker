import type { Meta, StoryObj } from '@storybook/react';
import { SearchResult } from './SearchResult';

const meta = {
    title: 'Search/SearchResult',
    component: SearchResult,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof SearchResult>;

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

export const FreeToPlay: Story = {
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

export const WithPriceChange: Story = {
    args: {
        item: {
            id: 3,
            itemId: 11840,
            name: 'Dragon boots',
            description: 'A pair of sturdy boots.',
            iconUrl: 'https://oldschool.runescape.wiki/images/thumb/Dragon_boots.png/120px-Dragon_boots.png',
            members: true,
            buyLimit: 0,
            highAlch: 0,
            lowAlch: 0,
            currentPrice: {
                itemId: 11840,
                highPrice: 210000,
                highPriceTime: new Date().toISOString(),
                lowPrice: 200000,
                lowPriceTime: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                change24h: -2.4,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    },
};

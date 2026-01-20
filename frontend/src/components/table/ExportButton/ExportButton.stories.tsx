import type { Meta, StoryObj } from '@storybook/react';
import { ExportButton } from './ExportButton';

const meta = {
    title: 'Table/ExportButton',
    component: ExportButton,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof ExportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        data: [],
    }
};

export const WithData: Story = {
    args: {
        filename: 'watchlist-items',
        data: [
            {
                id: 1,
                itemId: 4151,
                name: 'Abyssal whip',
                iconUrl: 'https://oldschool.runescape.wiki/images/thumb/Abyssal_whip.png/120px-Abyssal_whip.png',
                members: true,
                buyLimit: 70,
                highAlch: 72000,
                lowAlch: 48000,
                currentPrice: {
                    itemId: 4151,
                    highPrice: 2500000,
                    lowPrice: 2400000,
                    updatedAt: new Date().toISOString(),
                    highPriceTime: new Date().toISOString(),
                    lowPriceTime: new Date().toISOString(),
                },
                description: 'A weapon from the abyss.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ],
    },
};

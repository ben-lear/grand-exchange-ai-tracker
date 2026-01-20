import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ItemGrid } from './ItemGrid';

const meta: Meta<typeof ItemGrid> = {
    title: 'Watchlist/ItemGrid',
    component: ItemGrid,
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
type Story = StoryObj<typeof ItemGrid>;

const mockItems = [
    {
        itemId: 1,
        name: 'Bronze sword',
        iconUrl: 'https://oldschool.runescape.wiki/images/Bronze_sword.png',
        addedAt: 1700000000000,
    },
    {
        itemId: 2,
        name: 'Iron sword',
        iconUrl: 'https://oldschool.runescape.wiki/images/Iron_sword.png',
        addedAt: 1700000100000,
    },
    {
        itemId: 4151,
        name: 'Abyssal whip',
        iconUrl: 'https://oldschool.runescape.wiki/images/Abyssal_whip.png',
        addedAt: 1700000200000,
    },
    {
        itemId: 11802,
        name: 'Armadyl godsword',
        iconUrl: 'https://oldschool.runescape.wiki/images/Armadyl_godsword.png',
        addedAt: 1700000300000,
    },
    {
        itemId: 995,
        name: 'Coins',
        iconUrl: 'https://oldschool.runescape.wiki/images/Coins_1000.png',
        addedAt: 1700000400000,
    },
    {
        itemId: 561,
        name: 'Nature rune',
        iconUrl: 'https://oldschool.runescape.wiki/images/Nature_rune.png',
        addedAt: 1700000500000,
    },
];

const manyItems = Array.from({ length: 24 }, (_, i) => ({
    itemId: i + 1,
    name: `Item ${i + 1}`,
    iconUrl: `https://oldschool.runescape.wiki/images/Coins_1000.png`,
    addedAt: 1700000600000 + i * 1000,
}));

export const Empty: Story = {
    args: {
        items: [],
    },
};

export const WithTitle: Story = {
    args: {
        items: mockItems,
        title: 'Items',
    },
};

export const WithLinks: Story = {
    args: {
        items: mockItems,
        title: 'Clickable Items',
        showLinks: true,
    },
};

export const SmallGrid: Story = {
    args: {
        items: mockItems.slice(0, 3),
        title: 'Small Collection',
    },
};

export const LargeGrid: Story = {
    args: {
        items: manyItems,
        title: 'Large Collection',
    },
};

export const SingleItem: Story = {
    args: {
        items: [mockItems[0]],
        title: 'Single Item',
    },
};

export const LongItemNames: Story = {
    args: {
        items: [
            {
                itemId: 1,
                name: 'Very long item name that might wrap',
                iconUrl: 'https://oldschool.runescape.wiki/images/Coins_1000.png',
                addedAt: 1700000700000,
            },
            {
                itemId: 2,
                name: '3rd age platebody (shadow)',
                iconUrl: 'https://oldschool.runescape.wiki/images/Coins_1000.png',
                addedAt: 1700000800000,
            },
            {
                itemId: 3,
                name: 'Twisted bow (broken)',
                iconUrl: 'https://oldschool.runescape.wiki/images/Coins_1000.png',
                addedAt: 1700000900000,
            },
        ],
        title: 'Long Names',
    },
};

export const WithoutIcons: Story = {
    args: {
        items: [
            {
                itemId: 1,
                name: 'Item without icon',
                iconUrl: '',
                addedAt: 1700001000000,
            },
            {
                itemId: 2,
                name: 'Another item',
                iconUrl: '',
                addedAt: 1700001100000,
            },
        ],
        title: 'No Icons',
    },
};
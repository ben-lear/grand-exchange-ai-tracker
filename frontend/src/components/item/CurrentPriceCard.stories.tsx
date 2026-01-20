import type { CurrentPrice } from '@/types';
import type { Meta, StoryObj } from '@storybook/react';
import { CurrentPriceCard } from './CurrentPriceCard';

const meta: Meta<typeof CurrentPriceCard> = {
    title: 'Item/CurrentPriceCard',
    component: CurrentPriceCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof CurrentPriceCard>;

const createMockPrice = (
    itemId: number,
    highPrice: number | null,
    lowPrice: number | null,
    minutesAgo: { high?: number; low?: number; updated: number } = { updated: 1 }
): CurrentPrice => {
    const now = Date.now();
    return {
        itemId,
        highPrice,
        lowPrice,
        highPriceTime: minutesAgo.high ? new Date(now - minutesAgo.high * 60000).toISOString() : null,
        lowPriceTime: minutesAgo.low ? new Date(now - minutesAgo.low * 60000).toISOString() : null,
        updatedAt: new Date(now - minutesAgo.updated * 60000).toISOString(),
    };
};

export const Default: Story = {
    args: {
        price: createMockPrice(2, 238, 224, { high: 5, low: 4, updated: 1 }),
    },
};

export const HighValue: Story = {
    args: {
        price: createMockPrice(4151, 1250, 1150, { high: 3, low: 2, updated: 0.5 }),
    },
};

export const LargeMargin: Story = {
    args: {
        price: createMockPrice(11802, 35000000, 32000000, { high: 10, low: 8, updated: 2 }),
    },
};

export const SmallMargin: Story = {
    args: {
        price: createMockPrice(995, 1001, 1000, { high: 1, low: 0.75, updated: 0.17 }),
    },
};

export const OnlyHighPrice: Story = {
    args: {
        price: createMockPrice(1234, 5000, null, { high: 5, updated: 1 }),
    },
};

export const OnlyLowPrice: Story = {
    args: {
        price: createMockPrice(5678, null, 3000, { low: 3, updated: 0.75 }),
    },
};

export const NoPrices: Story = {
    args: {
        price: createMockPrice(9999, null, null, { updated: 2 }),
    },
};

export const RecentlyUpdated: Story = {
    args: {
        price: createMockPrice(2, 240, 226, { high: 0.08, low: 0.05, updated: 0.017 }),
    },
};

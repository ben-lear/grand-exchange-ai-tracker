import type { Meta, StoryObj } from '@storybook/react';
import { PriceChart } from './PriceChart';

const meta = {
    title: 'Charts/PriceChart',
    component: PriceChart,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof PriceChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        data: [
            { timestamp: Date.now() - 3600000, price: 1000, volume: 100 },
            { timestamp: Date.now() - 1800000, price: 1100, volume: 150 },
            { timestamp: Date.now(), price: 1050, volume: 120 },
        ],
        period: '24h',
    }
};

export const EmptyData: Story = {
    args: {
        data: [],
        period: '24h',
    },
};

export const VolatileData: Story = {
    args: {
        data: [
            { timestamp: Date.now() - 3600000 * 6, price: 800, volume: 220 },
            { timestamp: Date.now() - 3600000 * 4, price: 1400, volume: 320 },
            { timestamp: Date.now() - 3600000 * 2, price: 900, volume: 180 },
            { timestamp: Date.now(), price: 1300, volume: 260 },
        ],
        period: '7d',
    },
};

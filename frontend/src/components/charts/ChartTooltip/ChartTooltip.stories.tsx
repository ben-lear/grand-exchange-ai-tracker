import type { Meta, StoryObj } from '@storybook/react';
import { ChartTooltip } from './ChartTooltip';

const meta = {
    title: 'Charts/ChartTooltip',
    component: ChartTooltip,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof ChartTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseTimestamp = new Date('2024-01-01T12:00:00Z').getTime();

export const Default: Story = { args: {} };

export const SinglePrice: Story = {
    args: {
        active: true,
        label: baseTimestamp,
        payload: [
            {
                value: 1500,
                dataKey: 'price',
                color: '#3b82f6',
                payload: {
                    timestamp: baseTimestamp,
                    price: 1500,
                },
            },
        ],
    },
};

export const DualPrices: Story = {
    args: {
        active: true,
        label: baseTimestamp,
        coordinate: { x: 120, y: 100 },
        viewBox: { x: 0, y: 0, width: 300, height: 200 },
        payload: [
            {
                value: 1800,
                dataKey: 'highPrice',
                color: '#22c55e',
                coordinate: { x: 120, y: 50 },
                payload: {
                    timestamp: baseTimestamp,
                    highPrice: 1800,
                    lowPrice: 1400,
                    highPriceVolume: 250,
                    lowPriceVolume: 180,
                },
            },
            {
                value: 1400,
                dataKey: 'lowPrice',
                color: '#f97316',
                coordinate: { x: 120, y: 120 },
                payload: {
                    timestamp: baseTimestamp,
                    highPrice: 1800,
                    lowPrice: 1400,
                    highPriceVolume: 250,
                    lowPriceVolume: 180,
                },
            },
        ],
    },
};

/**
 * Storybook stories for ChartStatistics component
 */

import type { ChartStats } from '@/hooks/useChartData';
import type { Meta, StoryObj } from '@storybook/react';
import { ChartStatistics } from './ChartStatistics';

const meta: Meta<typeof ChartStatistics> = {
    title: 'Charts/ChartStatistics',
    component: ChartStatistics,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ChartStatistics>;

const baseStats: ChartStats = {
    firstPrice: 1000,
    lastPrice: 1200,
    minPrice: 900,
    maxPrice: 1300,
    change: 200,
    changePercent: 20,
    trend: 'up',
};

export const PositiveChange: Story = {
    args: {
        stats: baseStats,
        itemName: 'Dragon bones',
    },
};

export const NegativeChange: Story = {
    args: {
        stats: {
            firstPrice: 1000,
            lastPrice: 800,
            minPrice: 750,
            maxPrice: 1100,
            change: -200,
            changePercent: -20,
            trend: 'down',
        },
        itemName: 'Rune platebody',
    },
};

export const FlatTrend: Story = {
    args: {
        stats: {
            firstPrice: 1000,
            lastPrice: 1000,
            minPrice: 950,
            maxPrice: 1050,
            change: 0,
            changePercent: 0,
            trend: 'flat',
        },
        itemName: 'Bronze sword',
    },
};

export const WithoutItemName: Story = {
    args: {
        stats: baseStats,
    },
};

export const LargeNumbers: Story = {
    args: {
        stats: {
            firstPrice: 50000000,
            lastPrice: 75000000,
            minPrice: 48000000,
            maxPrice: 80000000,
            change: 25000000,
            changePercent: 50,
            trend: 'up',
        },
        itemName: 'Twisted bow',
    },
};

export const SmallPercentageChange: Story = {
    args: {
        stats: {
            firstPrice: 10000,
            lastPrice: 10010,
            minPrice: 9990,
            maxPrice: 10020,
            change: 10,
            changePercent: 0.1,
            trend: 'up',
        },
        itemName: 'Lobster',
    },
};

export const LargePercentageChange: Story = {
    args: {
        stats: {
            firstPrice: 100,
            lastPrice: 500,
            minPrice: 95,
            maxPrice: 550,
            change: 400,
            changePercent: 400,
            trend: 'up',
        },
        itemName: 'Newly released item',
    },
};

export const NegativeLargePercentage: Story = {
    args: {
        stats: {
            firstPrice: 500,
            lastPrice: 100,
            minPrice: 95,
            maxPrice: 550,
            change: -400,
            changePercent: -80,
            trend: 'down',
        },
        itemName: 'Crashed item',
    },
};

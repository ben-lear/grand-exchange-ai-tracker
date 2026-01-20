import type { TimePeriod } from '@/types';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PriceChartSection, type PriceChartSectionProps } from './PriceChartSection';

const meta: Meta<typeof PriceChartSection> = {
    title: 'Item/PriceChartSection',
    component: PriceChartSection,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof PriceChartSection>;

// Interactive wrapper for period selection
const InteractivePriceChartSection = (args: PriceChartSectionProps) => {
    const [period, setPeriod] = useState<TimePeriod>(args.period ?? '30d');

    return (
        <PriceChartSection
            {...args}
            period={period}
            onPeriodChange={setPeriod}
        />
    );
};

export const Default: Story = {
    args: {
        itemId: 2,
        itemName: 'Cannonball',
        period: '30d',
        isConnected: true,
        lastHeartbeatAt: Date.now(),
        reconnectCount: 0,
    },
};

export const Interactive: Story = {
    render: (args) => <InteractivePriceChartSection {...args} />,
    args: {
        itemId: 2,
        itemName: 'Cannonball',
        period: '30d',
        isConnected: true,
        lastHeartbeatAt: Date.now(),
        reconnectCount: 0,
    },
};

export const Disconnected: Story = {
    args: {
        itemId: 4151,
        itemName: 'Abyssal whip',
        period: '7d',
        isConnected: false,
        lastHeartbeatAt: null,
        reconnectCount: 0,
    },
};

export const Reconnecting: Story = {
    args: {
        itemId: 11802,
        itemName: 'Armadyl godsword',
        period: '24h',
        isConnected: false,
        lastHeartbeatAt: Date.now() - 30000,
        reconnectCount: 3,
    },
};

export const ShortPeriod: Story = {
    render: (args) => <InteractivePriceChartSection {...args} />,
    args: {
        itemId: 2,
        itemName: 'Cannonball',
        period: '1h',
        isConnected: true,
        lastHeartbeatAt: Date.now(),
        reconnectCount: 0,
    },
};

export const LongPeriod: Story = {
    render: (args) => <InteractivePriceChartSection {...args} />,
    args: {
        itemId: 2,
        itemName: 'Cannonball',
        period: '1y',
        isConnected: true,
        lastHeartbeatAt: Date.now(),
        reconnectCount: 0,
    },
};

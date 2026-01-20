import type { Meta, StoryObj } from '@storybook/react';
import { LiveIndicator } from './LiveIndicator';

const meta = {
    title: 'Charts/LiveIndicator',
    component: LiveIndicator,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof LiveIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isConnected: true,
        lastUpdateTime: new Date(),
        reconnectCount: 0,
    }
};

export const Disconnected: Story = {
    args: {
        isConnected: false,
        lastUpdateTime: null,
        reconnectCount: 0,
    },
};

export const Reconnecting: Story = {
    args: {
        isConnected: false,
        lastUpdateTime: new Date(Date.now() - 1000 * 60 * 5),
        reconnectCount: 3,
    },
};

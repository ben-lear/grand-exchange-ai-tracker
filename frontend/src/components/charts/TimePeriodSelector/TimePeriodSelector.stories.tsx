import type { Meta, StoryObj } from '@storybook/react';
import { TimePeriodSelector } from './TimePeriodSelector';

const meta = {
    title: 'Charts/TimePeriodSelector',
    component: TimePeriodSelector,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof TimePeriodSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        activePeriod: '24h',
        onPeriodChange: () => { },
    }
};

export const WeekSelected: Story = {
    args: {
        activePeriod: '7d',
        onPeriodChange: () => { },
    },
};

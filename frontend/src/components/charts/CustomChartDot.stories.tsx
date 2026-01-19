/**
 * Storybook stories for CustomChartDot component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CustomChartDot } from './CustomChartDot';

const meta: Meta<typeof CustomChartDot> = {
    title: 'Charts/CustomChartDot',
    component: CustomChartDot,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    decorators: [
        (Story) => (
            <svg width="200" height="200" style={{ border: '1px solid #ccc' }}>
                <Story />
            </svg>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof CustomChartDot>;

export const HistoricalData: Story = {
    args: {
        cx: 100,
        cy: 100,
        payload: { isLive: false },
        fill: '#10b981',
    },
};

export const LiveData: Story = {
    args: {
        cx: 100,
        cy: 100,
        payload: { isLive: true },
        fill: '#10b981',
    },
};

export const LiveDataRed: Story = {
    args: {
        cx: 100,
        cy: 100,
        payload: { isLive: true },
        fill: '#ef4444',
    },
};

export const LiveDataOrange: Story = {
    args: {
        cx: 100,
        cy: 100,
        payload: { isLive: true },
        fill: '#f97316',
    },
};

export const MultipleDotsInChart: Story = {
    render: () => (
        <svg width="400" height="200" style={{ border: '1px solid #ccc' }}>
            {/* Historical dots */}
            <CustomChartDot cx={50} cy={100} payload={{ isLive: false }} fill="#10b981" />
            <CustomChartDot cx={100} cy={80} payload={{ isLive: false }} fill="#10b981" />
            <CustomChartDot cx={150} cy={90} payload={{ isLive: false }} fill="#10b981" />
            <CustomChartDot cx={200} cy={70} payload={{ isLive: false }} fill="#10b981" />

            {/* Live dot (pulsing) */}
            <CustomChartDot cx={250} cy={60} payload={{ isLive: true }} fill="#10b981" />

            {/* Low price line */}
            <CustomChartDot cx={50} cy={120} payload={{ isLive: false }} fill="#f97316" />
            <CustomChartDot cx={100} cy={110} payload={{ isLive: false }} fill="#f97316" />
            <CustomChartDot cx={150} cy={115} payload={{ isLive: false }} fill="#f97316" />
            <CustomChartDot cx={200} cy={100} payload={{ isLive: false }} fill="#f97316" />
            <CustomChartDot cx={250} cy={95} payload={{ isLive: true }} fill="#f97316" />

            {/* Reference lines */}
            <line x1="0" y1="100" x2="400" y2="100" stroke="#ccc" strokeDasharray="5 5" />
        </svg>
    ),
};

export const NoPayload: Story = {
    args: {
        cx: 100,
        cy: 100,
        fill: '#10b981',
    },
};

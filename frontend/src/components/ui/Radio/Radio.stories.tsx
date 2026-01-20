import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';

const meta = {
    title: 'UI/Radio',
    component: Radio,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        checked: false,
        onChange: () => { },
    },
};

export const Checked: Story = {
    args: {
        checked: true,
        onChange: () => { },
    },
};

export const Disabled: Story = {
    args: {
        checked: true,
        disabled: true,
        onChange: () => { },
    },
};

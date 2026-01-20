import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta = {
    title: 'UI/Checkbox',
    component: Checkbox,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

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

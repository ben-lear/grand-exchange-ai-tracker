import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
    title: 'UI/Input',
    component: Input,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Search items...',
        onChange: () => { },
    },
};

export const WithValue: Story = {
    args: {
        value: 'Abyssal whip',
        placeholder: 'Search items...',
        onChange: () => { },
    },
};

export const ErrorState: Story = {
    args: {
        placeholder: 'Invalid input',
        variant: 'error',
        onChange: () => { },
    },
};

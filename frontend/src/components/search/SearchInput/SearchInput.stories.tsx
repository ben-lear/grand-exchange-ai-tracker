import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput';

const meta = {
    title: 'Search/SearchInput',
    component: SearchInput,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        value: '',
        onChange: () => { },
    }
};

export const WithValue: Story = {
    args: {
        value: 'Abyssal whip',
        onChange: () => { },
    },
};

export const WithShortcut: Story = {
    args: {
        value: '',
        onChange: () => { },
        showShortcut: true,
        placeholder: 'Search items',
    },
};

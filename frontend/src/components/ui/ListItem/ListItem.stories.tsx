/**
 * ListItem component stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Star } from 'lucide-react';
import { ListItem } from './ListItem';

const meta: Meta<typeof ListItem> = {
    title: 'UI/ListItem',
    component: ListItem,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'List item content',
    },
};

export const WithIcon: Story = {
    args: {
        children: 'Favorited item',
        icon: Star,
    },
};

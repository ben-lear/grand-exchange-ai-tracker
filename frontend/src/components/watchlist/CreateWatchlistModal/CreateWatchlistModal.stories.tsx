import type { Meta, StoryObj } from '@storybook/react';
import { CreateWatchlistModal } from './CreateWatchlistModal';

const meta = {
    title: 'Watchlist/CreateWatchlistModal',
    component: CreateWatchlistModal,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof CreateWatchlistModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
    }
};

export const Closed: Story = {
    args: {
        isOpen: false,
        onClose: () => { },
    },
};

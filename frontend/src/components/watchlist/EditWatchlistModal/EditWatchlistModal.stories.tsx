import type { Meta, StoryObj } from '@storybook/react';
import { EditWatchlistModal } from './EditWatchlistModal';

const meta = {
    title: 'Watchlist/EditWatchlistModal',
    component: EditWatchlistModal,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof EditWatchlistModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        watchlist: { id: '1', name: 'Example Watchlist', items: [], createdAt: Date.now(), updatedAt: Date.now(), isDefault: false },
    }
};

export const LongName: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        watchlist: {
            id: '2',
            name: 'PVM Supplies and Bossing Gear (Long Name)',
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDefault: false,
        },
    },
};

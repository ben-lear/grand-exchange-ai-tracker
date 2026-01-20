import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const meta = {
    title: 'Watchlist/ConfirmDeleteModal',
    component: ConfirmDeleteModal,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof ConfirmDeleteModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        onConfirm: () => { },
        watchlist: { id: '1', name: 'Example Watchlist', items: [], createdAt: Date.now(), updatedAt: Date.now(), isDefault: false },
    }
};

export const SingleItem: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        onConfirm: () => { },
        watchlist: {
            id: '2',
            name: 'Singles',
            items: [{ itemId: 4151, name: 'Abyssal whip', iconUrl: '', addedAt: Date.now() }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDefault: false,
        },
    },
};

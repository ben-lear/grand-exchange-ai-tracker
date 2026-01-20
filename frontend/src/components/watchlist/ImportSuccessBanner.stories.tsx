import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ImportSuccessBanner } from './ImportSuccessBanner';

const meta: Meta<typeof ImportSuccessBanner> = {
    title: 'Watchlist/ImportSuccessBanner',
    component: ImportSuccessBanner,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BrowserRouter>
                <Story />
            </BrowserRouter>
        ),
    ],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ImportSuccessBanner>;

export const Default: Story = {
    args: {
        watchlistName: 'My Favorite Items',
    },
};

export const ShortName: Story = {
    args: {
        watchlistName: 'PvP Gear',
    },
};

export const LongName: Story = {
    args: {
        watchlistName: 'My Complete Collection of High-Value Trading Items',
    },
};

export const SpecialCharacters: Story = {
    args: {
        watchlistName: 'Items & Gear (PvP/PvM)',
    },
};

export const EmptyName: Story = {
    args: {
        watchlistName: '',
    },
};

export const NumbersAndSymbols: Story = {
    args: {
        watchlistName: 'Top 100 Items - 2024 Edition!',
    },
};
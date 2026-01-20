import type { Meta, StoryObj } from '@storybook/react';
import { ShareInfoBanner } from './ShareInfoBanner';

const meta: Meta<typeof ShareInfoBanner> = {
    title: 'Watchlist/ShareInfoBanner',
    component: ShareInfoBanner,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ShareInfoBanner>;

export const Default: Story = {
    args: {
        token: 'abc123xyz789',
        expirationText: '3 days',
        accessCount: 5,
    },
};

export const FirstAccess: Story = {
    args: {
        token: 'first-access-token',
        expirationText: '7 days',
        accessCount: 0,
    },
};

export const ExpiringSoon: Story = {
    args: {
        token: 'expiring-soon-token',
        expirationText: '2 hours',
        accessCount: 23,
    },
};

export const Expired: Story = {
    args: {
        token: 'expired-token-123',
        expirationText: 'Expired',
        accessCount: 15,
    },
};

export const HighAccess: Story = {
    args: {
        token: 'popular-share-token',
        expirationText: '5 days',
        accessCount: 147,
    },
};

export const LongToken: Story = {
    args: {
        token: 'this-is-a-very-long-share-token-that-might-need-special-handling',
        expirationText: '1 day',
        accessCount: 3,
    },
};

export const ShortExpiry: Story = {
    args: {
        token: 'urgent-token',
        expirationText: '30 minutes',
        accessCount: 1,
    },
};
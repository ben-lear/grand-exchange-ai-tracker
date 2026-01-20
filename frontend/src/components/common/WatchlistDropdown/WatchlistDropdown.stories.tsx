import type { Meta, StoryObj } from '@storybook/react';
import { WatchlistDropdown } from './WatchlistDropdown';

const meta = {
    title: 'Common/WatchlistDropdown',
    component: WatchlistDropdown,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof WatchlistDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        itemId: 2,
        itemName: 'Abyssal whip',
        itemIconUrl: 'https://oldschool.runescape.wiki/images/thumb/Abyssal_whip.png/120px-Abyssal_whip.png',
    }
};

export const LongName: Story = {
    args: {
        itemId: 4151,
        itemName: 'Abyssal whip (ornamented) with a very long name',
        itemIconUrl: 'https://oldschool.runescape.wiki/images/thumb/Abyssal_whip.png/120px-Abyssal_whip.png',
    },
};

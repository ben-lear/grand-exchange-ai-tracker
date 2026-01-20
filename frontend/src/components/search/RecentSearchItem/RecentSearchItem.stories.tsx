import type { Meta, StoryObj } from '@storybook/react';
import { RecentSearchItem } from './RecentSearchItem';

const meta = {
    title: 'Search/RecentSearchItem',
    component: RecentSearchItem,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof RecentSearchItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        item: { itemId: 4151, name: 'Abyssal whip', icon: 'https://oldschool.runescape.wiki/images/thumb/Abyssal_whip.png/120px-Abyssal_whip.png' },
        onRemove: () => { },
    }
};

export const LongName: Story = {
    args: {
        item: {
            itemId: 11802,
            name: 'Armadyl godsword (ornamented) with a long name',
            icon: 'https://oldschool.runescape.wiki/images/thumb/Armadyl_godsword.png/120px-Armadyl_godsword.png',
        },
        onRemove: () => { },
    },
};

/**
 * Mock item data for testing
 */

import type { Item, ItemSummary } from '@/types';

/**
 * Standard mock item - Abyssal whip
 */
export const mockItem: Item = {
    id: 1,
    itemId: 4151,
    name: 'Abyssal whip',
    description: 'A weapon from the abyss.',
    iconUrl: 'https://oldschool.runescape.wiki/images/Abyssal_whip.png',
    members: true,
    buyLimit: 70,
    highAlch: 72000,
    lowAlch: 48000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Collection of mock items for list testing
 */
export const mockItems: Item[] = [
    mockItem,
    {
        id: 2,
        itemId: 4153,
        name: 'Granite maul',
        description: 'A very heavy maul.',
        iconUrl: 'https://oldschool.runescape.wiki/images/Granite_maul.png',
        members: true,
        buyLimit: 70,
        highAlch: 22800,
        lowAlch: 15200,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 3,
        itemId: 11802,
        name: 'Armadyl godsword',
        description: 'A very powerful sword.',
        iconUrl: 'https://oldschool.runescape.wiki/images/Armadyl_godsword.png',
        members: true,
        buyLimit: 8,
        highAlch: 750000,
        lowAlch: 500000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 4,
        itemId: 1163,
        name: 'Rune full helm',
        description: 'Provides good protection.',
        iconUrl: 'https://oldschool.runescape.wiki/images/Rune_full_helm.png',
        members: false,
        buyLimit: 125,
        highAlch: 21120,
        lowAlch: 14080,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 5,
        itemId: 2,
        name: 'Cannonball',
        description: 'Ammo for the Dwarf Cannon.',
        iconUrl: 'https://oldschool.runescape.wiki/images/Cannonball.png',
        members: true,
        buyLimit: 11000,
        highAlch: 3,
        lowAlch: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
];

/**
 * Mock item summaries for dropdown/search testing
 */
export const mockItemSummaries: ItemSummary[] = mockItems.map(item => ({
    id: item.id,
    itemId: item.itemId,
    name: item.name,
    iconUrl: item.iconUrl,
    members: item.members,
}));

/**
 * Factory function to create a mock item with custom overrides
 *
 * @example
 * const customItem = createMockItem({ name: 'Custom Item', members: false });
 */
export function createMockItem(overrides?: Partial<Item>): Item {
    const id = Math.floor(Math.random() * 100000);
    return {
        ...mockItem,
        id,
        itemId: id,
        ...overrides,
    };
}

/**
 * Factory function to create multiple mock items
 *
 * @example
 * const items = createMockItems(10);
 */
export function createMockItems(count: number, baseOverrides?: Partial<Item>): Item[] {
    return Array.from({ length: count }, (_, index) =>
        createMockItem({
            id: index + 1,
            itemId: 1000 + index,
            name: `Test Item ${index + 1}`,
            ...baseOverrides,
        })
    );
}

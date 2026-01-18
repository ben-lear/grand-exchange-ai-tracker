/**
 * Pre-built watchlist templates for common item categories
 */

import type { WatchlistTemplate } from '../types/watchlist';

export const WATCHLIST_TEMPLATES: WatchlistTemplate[] = [
    {
        id: 'f2p-moneymakers',
        name: 'F2P Moneymakers',
        description: 'Common profitable items for Free-to-Play players',
        category: 'Money Making',
        icon: '💰',
        itemIds: [
            440, // Iron ore
            453, // Coal
            2349, // Bronze bar
            2351, // Steel bar
            1623, // Uncut sapphire
            1621, // Uncut emerald
            1619, // Uncut ruby
            1617, // Uncut diamond
            1513, // Magic logs
            1515, // Yew logs
            441, // Iron bar
            2353, // Steel bar
            1777, // Bow string
            1733, // Needle
            1734, // Thread
            1511, // Logs
        ],
    },
    {
        id: 'high-alch-items',
        name: 'High Alch Items',
        description: 'Items with good high alchemy profit margins',
        category: 'Magic Training',
        icon: '🔥',
        itemIds: [
            1213, // Rune longsword
            1185, // Rune platelegs
            1127, // Rune platebody
            1163, // Rune full helm
            1201, // Rune kiteshield
            1319, // Rune 2h sword
            1373, // Rune battleaxe
            1359, // Rune mace
            1333, // Rune scimitar
            2363, // Runite bar
            1079, // Adamant platelegs
            1111, // Adamant platebody
            1161, // Adamant full helm
            1199, // Adamant kiteshield
            1371, // Adamant battleaxe
        ],
    },
    {
        id: 'skilling-supplies',
        name: 'Skilling Supplies',
        description: 'Common materials for training skills',
        category: 'Training',
        icon: '⚒️',
        itemIds: [
            // Smithing
            440, // Iron ore
            453, // Coal
            2349, // Bronze bar
            2351, // Steel bar
            2353, // Mithril bar
            2355, // Adamant bar
            2357, // Rune bar

            // Crafting
            1739, // Leather
            1741, // Cowhide
            1734, // Thread
            1592, // Chisel

            // Cooking
            317, // Shrimps
            321, // Anchovies
            335, // Raw trout
            331, // Raw salmon
            359, // Raw tuna

            // Fletching
            1511, // Logs
            1521, // Oak logs
            1519, // Willow logs
            1517, // Maple logs
            1515, // Yew logs

            // Herblore
            249, // Guam leaf
            251, // Marrentill
            253, // Tarromin
            255, // Harralander
            257, // Ranarr weed
        ],
    },
    {
        id: 'pvp-essentials',
        name: 'PvP Essentials',
        description: 'Items commonly used in player vs player combat',
        category: 'Combat',
        icon: '⚔️',
        itemIds: [
            // Food
            385, // Shark
            7946, // Monkfish
            379, // Lobster
            361, // Tuna
            373, // Swordfish

            // Potions
            2436, // Super attack
            2440, // Super strength
            2444, // Ranging potion
            2452, // Super restore
            3024, // Super restore (4)

            // Equipment
            4151, // Abyssal whip
            6585, // Amulet of fury
            11834, // Dragon boots
            6737, // Berserker ring
            6570, // Amulet of glory(6)

            // Ammunition
            892, // Rune arrow
            890, // Adamant arrow
            4740, // Black d'hide body
            2497, // Black d'hide chaps
            2503, // Black d'hide vamb
        ],
    },
    {
        id: 'quest-items',
        name: 'Quest Items',
        description: 'Commonly needed quest and achievement diary materials',
        category: 'Quests',
        icon: '📜',
        itemIds: [
            // Common quest items
            314, // Feather
            1925, // Bucket
            1929, // Bucket of water
            1931, // Pot
            1933, // Pot of flour
            1935, // Jug
            1937, // Jug of water
            1939, // Bowl
            1947, // Rope
            1957, // Onion
            1965, // Cabbage
            1777, // Bow string

            // Achievement diary items
            2347, // Hammer
            590, // Tinderbox
            946, // Knife
            1511, // Logs
            307, // Fishing rod
            313, // Fishing bait
            301, // Lobster pot
        ],
    },
    {
        id: 'bossing-supplies',
        name: 'Bossing Supplies',
        description: 'Essential supplies for boss encounters',
        category: 'PvM',
        icon: '🐉',
        itemIds: [
            // Food
            385, // Shark
            7946, // Monkfish

            // Potions
            2436, // Super attack (4)
            2440, // Super strength (4)
            2444, // Ranging potion (4)
            2452, // Super restore (4)
            3024, // Super restore (3)
            6685, // Saradomin brew (4)

            // Supplies
            537, // Dragon bones
            526, // Bones
            9144, // Dragonstone bolt tips

            // Prayer
            560, // Death rune
            565, // Blood rune
            555, // Water rune
            557, // Earth rune
            559, // Fire rune
        ],
    },
    {
        id: 'gathering-skills',
        name: 'Gathering Skills',
        description: 'Resources from woodcutting, mining, and fishing',
        category: 'Gathering',
        icon: '🪓',
        itemIds: [
            // Woodcutting
            1511, // Logs
            1521, // Oak logs
            1519, // Willow logs
            1517, // Maple logs
            1515, // Yew logs
            1513, // Magic logs

            // Mining
            434, // Clay
            436, // Copper ore
            438, // Tin ore
            440, // Iron ore
            442, // Silver ore
            444, // Gold ore
            453, // Coal
            447, // Mithril ore
            449, // Adamantite ore
            451, // Runite ore

            // Fishing
            317, // Shrimps
            321, // Anchovies
            335, // Trout
            331, // Salmon
            359, // Tuna
            371, // Swordfish
            383, // Raw shark
        ],
    },
    {
        id: 'flipper-starter',
        name: 'Flipper Starter Pack',
        description: 'Popular items for Grand Exchange flipping',
        category: 'Merchanting',
        icon: '📈',
        itemIds: [
            // High volume items
            4151, // Abyssal whip
            6585, // Amulet of fury
            1513, // Magic logs
            385, // Shark
            2436, // Super attack (4)
            453, // Coal
            440, // Iron ore
            1623, // Uncut sapphire
            1621, // Uncut emerald
            1619, // Uncut ruby
            1617, // Uncut diamond
            1515, // Yew logs
            2357, // Rune bar
            1079, // Adamant platelegs
            1127, // Rune platebody
        ],
    },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WatchlistTemplate | undefined {
    return WATCHLIST_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WatchlistTemplate[] {
    return WATCHLIST_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Get all unique categories
 */
export function getTemplateCategories(): string[] {
    const categories = new Set(WATCHLIST_TEMPLATES.map((t) => t.category));
    return Array.from(categories).sort();
}

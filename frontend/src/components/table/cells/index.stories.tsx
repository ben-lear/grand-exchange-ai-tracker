import type { Item } from '@/types';
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { FavoriteCell } from './FavoriteCell';
import { ItemNameCell } from './ItemNameCell';
import { PinCell } from './PinCell';
import { PriceCell } from './PriceCell';
import { WatchlistCell } from './WatchlistCell';

const mockItem: Item = {
    id: 2,
    itemId: 2,
    name: 'Abyssal whip',
    description: 'A weapon from the abyss.',
    iconUrl: 'https://secure.runescape.com/m=itemdb_oldschool/1733961564542_obj_sprite.gif?id=4151',
    members: true,
    buyLimit: 70,
    highAlch: 72000,
    lowAlch: 48000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

const meta: Meta = {
    title: 'Table/Cells',
    decorators: [
        (Story) => (
            <BrowserRouter>
                <div className="p-8 max-w-4xl">
                    <Story />
                </div>
            </BrowserRouter>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;

// All cells in a table context
export const AllCells: StoryObj = {
    render: () => (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Pin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Favorite
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Watchlist
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        High Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Low Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Avg Price
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                    <td className="px-4 py-4">
                        <PinCell itemId={mockItem.itemId} />
                    </td>
                    <td className="px-4 py-4">
                        <FavoriteCell item={mockItem} />
                    </td>
                    <td className="px-4 py-4">
                        <WatchlistCell item={mockItem} />
                    </td>
                    <td className="px-4 py-4">
                        <ItemNameCell item={mockItem} />
                    </td>
                    <td className="px-4 py-4">
                        <PriceCell value={2100000} type="high" />
                    </td>
                    <td className="px-4 py-4">
                        <PriceCell value={2050000} type="low" />
                    </td>
                    <td className="px-4 py-4">
                        <PriceCell value={2075000} type="mid" />
                    </td>
                </tr>
            </tbody>
        </table>
    ),
};

// Pin Cell States
export const PinCellStates: StoryObj = {
    render: () => (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">Unpinned (Click to pin)</h3>
                <div className="border p-4 rounded inline-block">
                    <PinCell itemId={999} />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Pinned (Click to unpin)</h3>
                <div className="border p-4 rounded inline-block">
                    <PinCell itemId={1} />
                </div>
            </div>
        </div>
    ),
};

// Favorite Cell States
export const FavoriteCellStates: StoryObj = {
    render: () => (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">Not Favorited</h3>
                <div className="border p-4 rounded inline-block">
                    <FavoriteCell item={{ ...mockItem, itemId: 999 }} />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Favorited</h3>
                <div className="border p-4 rounded inline-block">
                    <FavoriteCell item={mockItem} />
                </div>
            </div>
        </div>
    ),
};

// Price Cell Variants
export const PriceCellVariants: StoryObj = {
    render: () => (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">High Price (Green)</h3>
                <div className="border p-4 rounded inline-block">
                    <PriceCell value={2100000} type="high" />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Low Price (Orange)</h3>
                <div className="border p-4 rounded inline-block">
                    <PriceCell value={2050000} type="low" />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Average Price (Blue)</h3>
                <div className="border p-4 rounded inline-block">
                    <PriceCell value={2075000} type="mid" />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">No Price</h3>
                <div className="border p-4 rounded inline-block">
                    <PriceCell value={undefined} />
                </div>
            </div>
        </div>
    ),
};

// Price Cell - Different Values
export const PriceCellValues: StoryObj = {
    render: () => (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium">Formatted</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                    <td className="px-4 py-4 text-sm">42</td>
                    <td className="px-4 py-4">
                        <PriceCell value={42} type="mid" />
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-4 text-sm">1,234</td>
                    <td className="px-4 py-4">
                        <PriceCell value={1234} type="mid" />
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-4 text-sm">50,000</td>
                    <td className="px-4 py-4">
                        <PriceCell value={50000} type="mid" />
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-4 text-sm">2,500,000</td>
                    <td className="px-4 py-4">
                        <PriceCell value={2500000} type="mid" />
                    </td>
                </tr>
                <tr>
                    <td className="px-4 py-4 text-sm">1,234,567,890</td>
                    <td className="px-4 py-4">
                        <PriceCell value={1234567890} type="mid" />
                    </td>
                </tr>
            </tbody>
        </table>
    ),
};

// Item Name Cell Variants
export const ItemNameCellVariants: StoryObj = {
    render: () => (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">With Icon</h3>
                <div className="border p-4 rounded">
                    <ItemNameCell item={mockItem} />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Without Icon</h3>
                <div className="border p-4 rounded">
                    <ItemNameCell item={{ ...mockItem, iconUrl: '' }} />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">Long Name</h3>
                <div className="border p-4 rounded">
                    <ItemNameCell
                        item={{
                            ...mockItem,
                            name: 'Third age druidic robe top (broken)',
                            itemId: 12345,
                        }}
                    />
                </div>
            </div>
        </div>
    ),
};

// Watchlist Cell States
export const WatchlistCellStates: StoryObj = {
    render: () => (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">With Watchlists</h3>
                <div className="border p-4 rounded">
                    <WatchlistCell item={mockItem} />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium mb-2">No Watchlists</h3>
                <div className="border p-4 rounded">
                    <WatchlistCell item={{ ...mockItem, itemId: 999 }} />
                </div>
            </div>
        </div>
    ),
};

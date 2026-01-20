/**
 * Mock price data for testing
 */

import type { CurrentPrice, PricePoint } from '@/types';

/**
 * Standard mock current price - matches mockItem (Abyssal whip)
 */
export const mockCurrentPrice: CurrentPrice = {
    itemId: 4151,
    highPrice: 1500000,
    highPriceTime: '2024-01-01T12:00:00Z',
    lowPrice: 1480000,
    lowPriceTime: '2024-01-01T11:55:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
};

/**
 * Collection of mock prices matching mockItems
 */
export const mockCurrentPrices: CurrentPrice[] = [
    mockCurrentPrice,
    {
        itemId: 4153,
        highPrice: 32000,
        highPriceTime: '2024-01-01T12:00:00Z',
        lowPrice: 30000,
        lowPriceTime: '2024-01-01T11:55:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
    },
    {
        itemId: 11802,
        highPrice: 15000000,
        highPriceTime: '2024-01-01T12:00:00Z',
        lowPrice: 14800000,
        lowPriceTime: '2024-01-01T11:55:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
    },
    {
        itemId: 1163,
        highPrice: 21000,
        highPriceTime: '2024-01-01T12:00:00Z',
        lowPrice: 20500,
        lowPriceTime: '2024-01-01T11:55:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
    },
    {
        itemId: 2,
        highPrice: 160,
        highPriceTime: '2024-01-01T12:00:00Z',
        lowPrice: 155,
        lowPriceTime: '2024-01-01T11:55:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
    },
];

/**
 * Mock price history data points
 */
export const mockPriceHistory: PricePoint[] = [
    {
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 24h ago
        avgHighPrice: 1500000,
        avgLowPrice: 1480000,
        highPriceVolume: 100,
        lowPriceVolume: 95,
    },
    {
        timestamp: Date.now() - 23 * 60 * 60 * 1000,
        avgHighPrice: 1510000,
        avgLowPrice: 1490000,
        highPriceVolume: 110,
        lowPriceVolume: 100,
    },
    {
        timestamp: Date.now() - 22 * 60 * 60 * 1000,
        avgHighPrice: 1505000,
        avgLowPrice: 1485000,
        highPriceVolume: 105,
        lowPriceVolume: 98,
    },
    {
        timestamp: Date.now() - 21 * 60 * 60 * 1000,
        avgHighPrice: 1520000,
        avgLowPrice: 1500000,
        highPriceVolume: 120,
        lowPriceVolume: 115,
    },
    {
        timestamp: Date.now() - 20 * 60 * 60 * 1000,
        avgHighPrice: 1515000,
        avgLowPrice: 1495000,
        highPriceVolume: 115,
        lowPriceVolume: 108,
    },
];

/**
 * Factory function to create a mock current price
 *
 * @example
 * const price = createMockCurrentPrice({ itemId: 123, highPrice: 5000 });
 */
export function createMockCurrentPrice(overrides?: Partial<CurrentPrice>): CurrentPrice {
    return {
        ...mockCurrentPrice,
        ...overrides,
    };
}

/**
 * Factory function to create mock price history
 *
 * @example
 * const history = createMockPriceHistory(24, 1500000); // 24 data points around 1.5M
 */
export function createMockPriceHistory(
    count: number,
    basePrice: number = 1500000,
    volatility: number = 0.02 // 2% volatility
): PricePoint[] {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    return Array.from({ length: count }, (_, i) => {
        const priceVariation = basePrice * volatility * (Math.random() - 0.5);
        const high = Math.round(basePrice + priceVariation + basePrice * 0.01);
        const low = Math.round(basePrice + priceVariation - basePrice * 0.01);

        return {
            timestamp: now - (count - i) * hourMs,
            avgHighPrice: high,
            avgLowPrice: low,
            highPriceVolume: Math.floor(50 + Math.random() * 100),
            lowPriceVolume: Math.floor(45 + Math.random() * 95),
        };
    });
}

/**
 * Create a map of item ID to current price for store testing
 */
export function createPriceMap(prices: CurrentPrice[] = mockCurrentPrices): Map<number, CurrentPrice> {
    return new Map(prices.map(p => [p.itemId, p]));
}

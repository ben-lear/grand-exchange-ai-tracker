/**
 * Unit tests for ChartTooltip component
 */

import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { ChartTooltip } from './ChartTooltip';

describe('ChartTooltip', () => {
    const mockPayload = [
        {
            value: 1000,
            dataKey: 'price',
            color: '#3b82f6',
            payload: {
                timestamp: new Date('2024-01-01').getTime(),
                price: 1000,
            },
        },
    ];

    it('should not render when inactive', () => {
        const { container } = render(
            <ChartTooltip active={false} payload={[]} label="" />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render when active with payload', () => {
        const expectedDate = format(new Date(mockPayload[0].payload.timestamp), 'MMM d, yyyy HH:mm');
        render(
            <ChartTooltip
                active={true}
                payload={mockPayload}
                label={mockPayload[0].payload.timestamp}
            />
        );

        expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it('should display price value', () => {
        render(
            <ChartTooltip
                active={true}
                payload={mockPayload}
                label={mockPayload[0].payload.timestamp}
            />
        );

        expect(screen.getByText(/1,000/)).toBeInTheDocument();
    });

    it('should render dual prices and volume when available', () => {
        const timestamp = new Date('2024-01-02T12:00:00Z').getTime();
        const dualPayload = [
            {
                value: 1200,
                dataKey: 'highPrice',
                color: '#22c55e',
                coordinate: { x: 10, y: 20 },
                payload: {
                    timestamp,
                    highPrice: 1200,
                    lowPrice: 1000,
                    highPriceVolume: 10,
                    lowPriceVolume: 20,
                },
            },
            {
                value: 1000,
                dataKey: 'lowPrice',
                color: '#f97316',
                coordinate: { x: 10, y: 60 },
                payload: {
                    timestamp,
                    highPrice: 1200,
                    lowPrice: 1000,
                    highPriceVolume: 10,
                    lowPriceVolume: 20,
                },
            },
        ];

        render(
            <ChartTooltip
                active={true}
                payload={dualPayload}
                label={timestamp}
                coordinate={{ x: 20, y: 20 }}
                viewBox={{ x: 0, y: 0, width: 100, height: 100 }}
            />
        );

        expect(screen.getByText('High:')).toBeInTheDocument();
        expect(screen.getByText('Low:')).toBeInTheDocument();
        expect(screen.getByText('Spread:')).toBeInTheDocument();
        expect(screen.getByText('Volume:')).toBeInTheDocument();
    });
});

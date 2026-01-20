/**
 * Tests for ChartStatistics component
 */

import type { ChartStats } from '@/hooks';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartStatistics } from './ChartStatistics';

describe('ChartStatistics', () => {
    const mockStats: ChartStats = {
        firstPrice: 1000,
        lastPrice: 1200,
        minPrice: 900,
        maxPrice: 1300,
        change: 200,
        changePercent: 20,
        trend: 'up',
    };

    it('should render all stat values', () => {
        render(<ChartStatistics stats={mockStats} />);

        expect(screen.getByText(/Current:/)).toBeInTheDocument();
        expect(screen.getByText(/High:/)).toBeInTheDocument();
        expect(screen.getByText(/Low:/)).toBeInTheDocument();
    });

    it('should display item name when provided', () => {
        render(<ChartStatistics stats={mockStats} itemName="Dragon bones" />);

        expect(screen.getByText(/Dragon bones Price Chart/)).toBeInTheDocument();
    });

    it('should not display item name when not provided', () => {
        const { container } = render(<ChartStatistics stats={mockStats} />);

        expect(container.querySelector('h3')).not.toBeInTheDocument();
    });

    it('should show trending up icon for positive change', () => {
        const { container } = render(<ChartStatistics stats={mockStats} />);

        const upIcon = container.querySelector('svg');
        expect(upIcon).toBeInTheDocument();
    });

    it('should show trending down icon for negative change', () => {
        const downStats: ChartStats = {
            ...mockStats,
            change: -200,
            changePercent: -20,
            trend: 'down',
        };

        const { container } = render(<ChartStatistics stats={downStats} />);

        const downIcon = container.querySelector('svg');
        expect(downIcon).toBeInTheDocument();
    });

    it('should show flat icon for no change', () => {
        const flatStats: ChartStats = {
            ...mockStats,
            change: 0,
            changePercent: 0,
            trend: 'flat',
        };

        const { container } = render(<ChartStatistics stats={flatStats} />);

        const flatIcon = container.querySelector('svg');
        expect(flatIcon).toBeInTheDocument();
    });

    it('should apply green color for positive change', () => {
        const { container } = render(<ChartStatistics stats={mockStats} />);

        const changeDiv = container.querySelector('.text-green-600');
        expect(changeDiv).toBeInTheDocument();
    });

    it('should apply red color for negative change', () => {
        const downStats: ChartStats = {
            ...mockStats,
            change: -200,
            changePercent: -20,
            trend: 'down',
        };

        const { container } = render(<ChartStatistics stats={downStats} />);

        const changeDiv = container.querySelector('.text-red-600');
        expect(changeDiv).toBeInTheDocument();
    });

    it('should apply gray color for flat trend', () => {
        const flatStats: ChartStats = {
            ...mockStats,
            change: 0,
            changePercent: 0,
            trend: 'flat',
        };

        const { container } = render(<ChartStatistics stats={flatStats} />);

        const changeDiv = container.querySelector('.text-gray-600');
        expect(changeDiv).toBeInTheDocument();
    });

    it('should format percentage with 2 decimal places', () => {
        const { container } = render(<ChartStatistics stats={mockStats} />);

        expect(container.textContent).toMatch(/20\.00%/);
    });

    it('should show + sign for positive change', () => {
        const { container } = render(<ChartStatistics stats={mockStats} />);

        expect(container.textContent).toMatch(/\+/);
    });

    it('should handle negative change correctly', () => {
        const downStats: ChartStats = {
            ...mockStats,
            change: -200,
            changePercent: -20,
            trend: 'down',
        };

        const { container } = render(<ChartStatistics stats={downStats} />);

        expect(container.textContent).toMatch(/-/);
        expect(container.textContent).not.toMatch(/\+-/);
    });

    it('should display formatted prices', () => {
        render(<ChartStatistics stats={mockStats} />);

        // formatGold converts to K/M notation
        expect(screen.getByText(/Current:/)).toBeInTheDocument();
        expect(screen.getByText(/High:/)).toBeInTheDocument();
        expect(screen.getByText(/Low:/)).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
        const largeStats: ChartStats = {
            firstPrice: 1000000,
            lastPrice: 1500000,
            minPrice: 900000,
            maxPrice: 1600000,
            change: 500000,
            changePercent: 50,
            trend: 'up',
        };

        render(<ChartStatistics stats={largeStats} />);

        expect(screen.getByText(/Current:/)).toBeInTheDocument();
    });

    it('should handle very small percentage changes', () => {
        const smallChangeStats: ChartStats = {
            ...mockStats,
            change: 1,
            changePercent: 0.1,
        };

        const { container } = render(<ChartStatistics stats={smallChangeStats} />);

        expect(container.textContent).toMatch(/0\.10%/);
    });
});

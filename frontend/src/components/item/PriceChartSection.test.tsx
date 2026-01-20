import type { TimePeriod } from '@/types';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PriceChartSection } from './PriceChartSection';

vi.mock('@/hooks', () => ({
    usePriceHistory: () => ({
        data: { data: [] },
        isLoading: false,
        error: null,
    }),
}));

// Mock the chart components
vi.mock('@/components/charts', () => ({
    PriceChart: ({ itemId, itemName, period }: { itemId: number; itemName: string; period: string }) => (
        <div data-testid="price-chart">
            Chart for {itemName} (ID: {itemId}) - Period: {period}
        </div>
    ),
    TimePeriodSelector: ({ activePeriod, onPeriodChange }: { activePeriod: string; onPeriodChange: (period: string) => void }) => (
        <div data-testid="period-selector">
            <button onClick={() => onPeriodChange('24h')}>24h</button>
            <button onClick={() => onPeriodChange('7d')}>7d</button>
            <span>Active: {activePeriod}</span>
        </div>
    ),
    LiveIndicator: ({ isConnected, reconnectCount }: { isConnected?: boolean; reconnectCount?: number }) => (
        <div data-testid="live-indicator">
            {isConnected ? 'Connected' : 'Disconnected'} (Reconnects: {reconnectCount})
        </div>
    ),
}));

describe('PriceChartSection', () => {
    const defaultProps = {
        itemId: 2,
        itemName: 'Cannonball',
        period: '30d' as TimePeriod,
        onPeriodChange: vi.fn(),
    };

    describe('Rendering', () => {
        it('should render title', () => {
            render(<PriceChartSection {...defaultProps} />);
            expect(screen.getByText('Price History')).toBeInTheDocument();
        });

        it('should render chart component', () => {
            render(<PriceChartSection {...defaultProps} />);
            expect(screen.getByTestId('price-chart')).toBeInTheDocument();
            expect(screen.getByText(/Chart for Cannonball/)).toBeInTheDocument();
        });

        it('should render period selector', () => {
            render(<PriceChartSection {...defaultProps} />);
            expect(screen.getByTestId('period-selector')).toBeInTheDocument();
        });

        it('should render live indicator', () => {
            render(<PriceChartSection {...defaultProps} />);
            expect(screen.getByTestId('live-indicator')).toBeInTheDocument();
        });

        it('should pass correct props to chart', () => {
            render(<PriceChartSection {...defaultProps} />);
            expect(screen.getByText(/ID: 2/)).toBeInTheDocument();
            expect(screen.getByText(/Period: 30d/)).toBeInTheDocument();
        });
    });

    describe('Live Indicator', () => {
        it('should show connected status when isConnected is true', () => {
            render(<PriceChartSection {...defaultProps} isConnected={true} />);
            expect(screen.getByText(/Connected/)).toBeInTheDocument();
        });

        it('should show disconnected status when isConnected is false', () => {
            render(<PriceChartSection {...defaultProps} isConnected={false} />);
            expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
        });

        it('should display reconnect count', () => {
            render(<PriceChartSection {...defaultProps} reconnectCount={3} />);
            expect(screen.getByText(/Reconnects: 3/)).toBeInTheDocument();
        });

        it('should handle default values', () => {
            render(<PriceChartSection {...defaultProps} />);
            expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
            expect(screen.getByText(/Reconnects: 0/)).toBeInTheDocument();
        });
    });

    describe('Period Selection', () => {
        it('should call onPeriodChange when period changes', async () => {
            const user = userEvent.setup();
            const onPeriodChange = vi.fn();

            render(
                <PriceChartSection
                    {...defaultProps}
                    onPeriodChange={onPeriodChange}
                />
            );

            const button24h = screen.getByText('24h');
            await user.click(button24h);

            expect(onPeriodChange).toHaveBeenCalledWith('24h');
        });

        it('should display active period', () => {
            render(<PriceChartSection {...defaultProps} period="7d" />);
            expect(screen.getByText(/Active: 7d/)).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <PriceChartSection {...defaultProps} className="custom-class" />
            );
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have default card styling', () => {
            const { container } = render(<PriceChartSection {...defaultProps} />);
            expect(container.firstChild).toHaveClass(
                'rounded-lg',
                'border',
                'bg-white',
                'dark:bg-gray-900'
            );
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            render(<PriceChartSection {...defaultProps} />);
            const heading = screen.getByRole('heading', { level: 2 });
            expect(heading).toHaveTextContent('Price History');
        });
    });
});

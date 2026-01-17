/**
 * Tests for PriceChart component
 */

import { PriceChart } from '@/components/charts/PriceChart';
import type { PricePoint } from '@/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock Recharts components
vi.mock('recharts', () => ({
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

const mockPriceData: PricePoint[] = [
  {
    timestamp: 1704067200000, // 2024-01-01T00:00:00Z
    price: 1000000,
    volume: 100,
  },
  {
    timestamp: 1704153600000, // 2024-01-02T00:00:00Z
    price: 1050000,
    volume: 150,
  },
  {
    timestamp: 1704240000000, // 2024-01-03T00:00:00Z
    price: 980000,
    volume: 80,
  },
];

describe('PriceChart', () => {
  const defaultProps = {
    data: mockPriceData,
    period: '30d' as const,
  };

  it('renders loading state', () => {
    render(<PriceChart {...defaultProps} data={[]} isLoading={true} />);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = new Error('Failed to load chart');
    render(<PriceChart {...defaultProps} data={[]} error={error} />);

    expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<PriceChart {...defaultProps} data={[]} />);

    expect(screen.getByText('No price data available')).toBeInTheDocument();
    expect(screen.getByText('Try selecting a different time period')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    render(<PriceChart {...defaultProps} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    // There are multiple line elements (high and low prices)
    expect(screen.getAllByTestId('line')).toHaveLength(2);
  });

  it('displays price statistics', () => {
    render(<PriceChart {...defaultProps} itemName="Test Item" />);

    expect(screen.getByText('Test Item Price Chart')).toBeInTheDocument();
    expect(screen.getByText('Current: 980.0K')).toBeInTheDocument(); // Last price
  });

  it('shows price change with trend', () => {
    render(<PriceChart {...defaultProps} />);

    // Should show negative change (980K - 1M = -20K)
    expect(screen.getByText('-20.0K')).toBeInTheDocument();
    expect(screen.getByText('(-2.00%)')).toBeInTheDocument();
  });

  it('shows trending down icon for negative change', () => {
    render(<PriceChart {...defaultProps} />);

    // Should render TrendingDown icon (we can't easily test the actual icon, but we can check the color class)
    const changeElement = screen.getByText('-20.0K').closest('div');
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('renders chart axes and grid', () => {
    render(<PriceChart {...defaultProps} />);

    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
  });

  it('includes tooltip', () => {
    render(<PriceChart {...defaultProps} />);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('includes reference line', () => {
    render(<PriceChart {...defaultProps} />);
    expect(screen.getByTestId('reference-line')).toBeInTheDocument();
  });

  it('handles positive price change correctly', () => {
    const positiveData: PricePoint[] = [
      {
        timestamp: 1704067200000,
        price: 1000000,
        volume: 100,
      },
      {
        timestamp: 1704153600000,
        price: 1200000,
        volume: 150,
      },
    ];

    render(<PriceChart {...defaultProps} data={positiveData} />);

    expect(screen.getByText('+200.0K')).toBeInTheDocument();
    expect(screen.getByText('(+20.00%)')).toBeInTheDocument();

    const changeElement = screen.getByText('+200.0K').closest('div');
    expect(changeElement).toHaveClass('text-green-600');
  });
});
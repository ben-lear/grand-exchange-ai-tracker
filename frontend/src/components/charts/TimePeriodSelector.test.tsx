/**
 * Tests for TimePeriodSelector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimePeriodSelector } from '@/components/charts/TimePeriodSelector';
import type { TimePeriod } from '@/types';

describe('TimePeriodSelector', () => {
  const defaultProps = {
    activePeriod: '30d' as TimePeriod,
    onPeriodChange: vi.fn(),
  };

  it('renders all period options', () => {
    render(<TimePeriodSelector {...defaultProps} />);
    
    expect(screen.getByText('24H')).toBeInTheDocument();
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
    expect(screen.getByText('ALL')).toBeInTheDocument();
  });

  it('highlights active period', () => {
    render(<TimePeriodSelector {...defaultProps} />);
    
    const activePeriod = screen.getByText('30D');
    expect(activePeriod).toHaveClass('bg-white', 'text-blue-600');
  });

  it('handles period change', () => {
    const onPeriodChange = vi.fn();
    render(<TimePeriodSelector {...defaultProps} onPeriodChange={onPeriodChange} />);
    
    const sevenDayButton = screen.getByText('7D');
    fireEvent.click(sevenDayButton);
    
    expect(onPeriodChange).toHaveBeenCalledWith('7d');
  });

  it('shows tooltips on hover', () => {
    render(<TimePeriodSelector {...defaultProps} />);
    
    const button24h = screen.getByText('24H');
    expect(button24h).toHaveAttribute('title', 'Last 24 hours');
    
    const button7d = screen.getByText('7D');
    expect(button7d).toHaveAttribute('title', 'Last 7 days');
    
    const button1y = screen.getByText('1Y');
    expect(button1y).toHaveAttribute('title', 'Last year');
    
    const buttonAll = screen.getByText('ALL');
    expect(buttonAll).toHaveAttribute('title', 'All time');
  });

  it('disables unavailable periods', () => {
    const availablePeriods: TimePeriod[] = ['24h', '7d', '30d'];
    render(
      <TimePeriodSelector
        {...defaultProps}
        availablePeriods={availablePeriods}
      />
    );
    
    const button90d = screen.getByText('90D');
    const button1y = screen.getByText('1Y');
    const buttonAll = screen.getByText('ALL');
    
    expect(button90d).toBeDisabled();
    expect(button1y).toBeDisabled();
    expect(buttonAll).toBeDisabled();
    
    // Available periods should not be disabled
    const button24h = screen.getByText('24H');
    const button7d = screen.getByText('7D');
    const button30d = screen.getByText('30D');
    
    expect(button24h).not.toBeDisabled();
    expect(button7d).not.toBeDisabled();
    expect(button30d).not.toBeDisabled();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<TimePeriodSelector {...defaultProps} disabled={true} />);
    
    const allButtons = screen.getAllByRole('button');
    allButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('does not call onPeriodChange when disabled', () => {
    const onPeriodChange = vi.fn();
    render(
      <TimePeriodSelector
        {...defaultProps}
        onPeriodChange={onPeriodChange}
        disabled={true}
      />
    );
    
    const button7d = screen.getByText('7D');
    fireEvent.click(button7d);
    
    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('does not call onPeriodChange for unavailable periods', () => {
    const onPeriodChange = vi.fn();
    const availablePeriods: TimePeriod[] = ['24h', '7d'];
    
    render(
      <TimePeriodSelector
        {...defaultProps}
        onPeriodChange={onPeriodChange}
        availablePeriods={availablePeriods}
      />
    );
    
    const button30d = screen.getByText('30D');
    fireEvent.click(button30d);
    
    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('applies correct styling for different states', () => {
    render(<TimePeriodSelector {...defaultProps} activePeriod="7d" />);
    
    // Active period should have special styling
    const activeButton = screen.getByText('7D');
    expect(activeButton).toHaveClass('bg-white', 'text-blue-600');
    
    // Inactive periods should have different styling
    const inactiveButton = screen.getByText('30D');
    expect(inactiveButton).toHaveClass('text-gray-600');
  });
});
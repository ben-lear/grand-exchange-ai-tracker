/**
 * Tests for TableToolbar component
 */

import { TableToolbar } from '@/components/table/TableToolbar';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('TableToolbar', () => {
  const defaultProps = {
    searchValue: '',
    onSearchChange: vi.fn(),
    totalCount: 1000,
    visibleCount: 1000,
  };

  it('renders search input', () => {
    render(<TableToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Filter items...')).toBeInTheDocument();
  });

  it('displays item counts', () => {
    render(<TableToolbar {...defaultProps} />);
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  it('displays filtered count when different from total', () => {
    render(<TableToolbar {...defaultProps} visibleCount={500} />);
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText(/of/)).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('handles search input and calls onChange', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(<TableToolbar {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Filter items...');
    await user.type(searchInput, 'whip');

    // Should call onChange for each character (debounce handled by parent)
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('shows clear button when search has value', async () => {
    const user = userEvent.setup();
    render(<TableToolbar {...defaultProps} searchValue="test" />);

    const searchInput = screen.getByDisplayValue('test');
    expect(searchInput).toBeInTheDocument();

    // Clear button should be visible (look for the X icon button)
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();

    // Click clear button
    await user.click(clearButton);
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('renders refresh button when onRefresh provided', () => {
    const onRefresh = vi.fn();
    render(<TableToolbar {...defaultProps} onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows spinning icon when refreshing', () => {
    render(<TableToolbar {...defaultProps} onRefresh={vi.fn()} isRefreshing={true} />);

    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    expect(refreshButton).toBeDisabled();

    // Check for spinning animation class
    const icon = refreshButton.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });

  it('renders filter button when provided', () => {
    const onFilterClick = vi.fn();
    render(<TableToolbar {...defaultProps} onFilterClick={onFilterClick} />);

    const filterButton = screen.getByRole('button', { name: /filter items/i });
    expect(filterButton).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();

    fireEvent.click(filterButton);
    expect(onFilterClick).toHaveBeenCalled();
  });

  it('renders column toggle button', () => {
    render(<TableToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /toggle column visibility/i })).toBeInTheDocument();
  });

  it('renders export button when provided', () => {
    const onExport = vi.fn();
    render(<TableToolbar {...defaultProps} onExport={onExport} />);

    const exportButton = screen.getByTitle('Export data');
    expect(exportButton).toBeInTheDocument();

    fireEvent.click(exportButton);
    expect(onExport).toHaveBeenCalled();
  });
});
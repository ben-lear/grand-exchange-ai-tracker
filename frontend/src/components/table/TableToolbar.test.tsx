/**
 * Tests for TableToolbar component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableToolbar } from '@/components/table/TableToolbar';

describe('TableToolbar', () => {
  const defaultProps = {
    searchValue: '',
    onSearchChange: vi.fn(),
    totalCount: 1000,
    visibleCount: 1000,
  };

  it('renders search input', () => {
    render(<TableToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
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

  it('handles search input with debounce', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    
    render(<TableToolbar {...defaultProps} onSearchChange={onSearchChange} />);
    
    const searchInput = screen.getByPlaceholderText('Search items...');
    await user.type(searchInput, 'whip');
    
    // Should not call immediately
    expect(onSearchChange).not.toHaveBeenCalled();
    
    // Should call after debounce delay
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('whip');
    }, { timeout: 500 });
  });

  it('shows clear button when search has value', async () => {
    const user = userEvent.setup();
    render(<TableToolbar {...defaultProps} searchValue="test" />);
    
    const searchInput = screen.getByDisplayValue('test');
    expect(searchInput).toBeInTheDocument();
    
    // Clear button should be visible (look for the X icon button)
    const clearButton = screen.getByRole('button');
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

  it('renders columns toggle when provided', () => {
    const onColumnsToggle = vi.fn();
    render(<TableToolbar {...defaultProps} onColumnsToggle={onColumnsToggle} />);
    
    const columnsButton = screen.getByRole('button', { name: /toggle columns/i });
    expect(columnsButton).toBeInTheDocument();
    
    fireEvent.click(columnsButton);
    expect(onColumnsToggle).toHaveBeenCalled();
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
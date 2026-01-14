/**
 * Tests for FilterPanel component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel, type FilterState } from '@/components/table/FilterPanel';

describe('FilterPanel', () => {
  const defaultFilters: FilterState = {
    members: 'all',
  };

  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
  };

  it('renders filter panel with title', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders membership filter options', () => {
    render(<FilterPanel {...defaultProps} />);
    
    expect(screen.getByText('All Items')).toBeInTheDocument();
    expect(screen.getByText('Members Only (P2P)')).toBeInTheDocument();
    expect(screen.getByText('Free-to-Play')).toBeInTheDocument();
  });

  it('renders price range inputs', () => {
    render(<FilterPanel {...defaultProps} />);
    
    expect(screen.getByText('Price Range (GP)')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Min')).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('Max')).toHaveLength(2);
  });

  it('renders volume range inputs', () => {
    render(<FilterPanel {...defaultProps} />);
    
    expect(screen.getByText('Daily Volume')).toBeInTheDocument();
    const volumeInputs = screen.getAllByPlaceholderText(/Min|Max/);
    expect(volumeInputs.length).toBeGreaterThanOrEqual(4); // 2 for price, 2 for volume
  });

  it('handles membership filter changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    
    render(<FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />);
    
    const membersRadio = screen.getByRole('radio', { name: /members only/i });
    await user.click(membersRadio);
    
    // Should update local state, but not call onFiltersChange until Apply is clicked
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);
    
    expect(onFiltersChange).toHaveBeenCalledWith({
      members: 'members',
    });
  });

  it('handles price range input changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    
    render(<FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />);
    
    const priceInputs = screen.getAllByPlaceholderText(/Min|Max/);
    const priceMinInput = priceInputs[0]; // First Min input should be for price
    
    await user.type(priceMinInput, '1000');
    
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);
    
    expect(onFiltersChange).toHaveBeenCalledWith({
      members: 'all',
      priceMin: 1000,
    });
  });

  it('shows active filters indicator', () => {
    const activeFilters: FilterState = {
      members: 'members',
      priceMin: 1000,
    };
    
    render(<FilterPanel {...defaultProps} filters={activeFilters} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows clear filters button when filters are active', () => {
    const activeFilters: FilterState = {
      members: 'members',
      priceMin: 1000,
    };
    
    render(<FilterPanel {...defaultProps} filters={activeFilters} />);
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('handles clear filters', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const activeFilters: FilterState = {
      members: 'members',
      priceMin: 1000,
    };
    
    render(<FilterPanel {...defaultProps} filters={activeFilters} onFiltersChange={onFiltersChange} />);
    
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    await user.click(clearButton);
    
    expect(onFiltersChange).toHaveBeenCalledWith({
      members: 'all',
    });
  });

  it('renders close button when onClose provided', () => {
    const onClose = vi.fn();
    render(<FilterPanel {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles volume range input changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    
    render(<FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />);
    
    // Get volume section inputs (should be the second set of Min/Max inputs)
    const volumeSection = screen.getByText('Daily Volume').closest('div');
    const volumeMinInput = volumeSection?.querySelector('input[placeholder="Min"]');
    
    if (volumeMinInput) {
      await user.type(volumeMinInput, '500');
      
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);
      
      expect(onFiltersChange).toHaveBeenCalledWith({
        members: 'all',
        volumeMin: 500,
      });
    }
  });
});
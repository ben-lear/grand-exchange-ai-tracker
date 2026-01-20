/**
 * Tests for FilterPanel component
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterPanel, type FilterState } from './FilterPanel';

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

describe('FilterPanel Accessibility', () => {
  const defaultFilters: FilterState = {
    members: 'all',
  };

  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
  };

  it('should have accessible price range inputs with IDs and labels', () => {
    render(<FilterPanel {...defaultProps} />);

    const minPriceInput = screen.getByLabelText(/minimum price/i);
    const maxPriceInput = screen.getByLabelText(/maximum price/i);

    expect(minPriceInput).toHaveAttribute('id', 'filter-price-min');
    expect(minPriceInput).toHaveAttribute('name', 'priceMin');
    expect(maxPriceInput).toHaveAttribute('id', 'filter-price-max');
    expect(maxPriceInput).toHaveAttribute('name', 'priceMax');
  });

  it('should have accessible volume range inputs with IDs and labels', () => {
    render(<FilterPanel {...defaultProps} />);

    const minVolumeInput = screen.getByLabelText(/minimum volume/i);
    const maxVolumeInput = screen.getByLabelText(/maximum volume/i);

    expect(minVolumeInput).toHaveAttribute('id', 'filter-volume-min');
    expect(minVolumeInput).toHaveAttribute('name', 'volumeMin');
    expect(maxVolumeInput).toHaveAttribute('id', 'filter-volume-max');
    expect(maxVolumeInput).toHaveAttribute('name', 'volumeMax');
  });

  it('should have properly grouped membership radio buttons with fieldset', () => {
    render(<FilterPanel {...defaultProps} />);

    // Check for fieldset with legend
    const fieldset = document.querySelector('fieldset');
    expect(fieldset).toBeInTheDocument();

    const legend = screen.getByText('Membership');
    expect(legend.tagName).toBe('LEGEND');

    // Check radio buttons
    const radioButtons = screen.getAllByRole('radio');
    const membershipRadios = radioButtons.filter(radio =>
      (radio as HTMLInputElement).name === 'members'
    );

    expect(membershipRadios).toHaveLength(3);
    membershipRadios.forEach(radio => {
      expect(radio).toHaveAttribute('name', 'members');
      expect(radio).toHaveAttribute('id');
    });
  });

  it('should update filters when price inputs change', () => {
    render(<FilterPanel {...defaultProps} />);

    const minPriceInput = screen.getByLabelText(/minimum price/i);
    const maxPriceInput = screen.getByLabelText(/maximum price/i);

    fireEvent.change(minPriceInput, { target: { value: '1000' } });
    expect(minPriceInput).toHaveValue(1000);

    fireEvent.change(maxPriceInput, { target: { value: '5000' } });
    expect(maxPriceInput).toHaveValue(5000);
  });

  it('should update filters when volume inputs change', () => {
    render(<FilterPanel {...defaultProps} />);

    const minVolumeInput = screen.getByLabelText(/minimum volume/i);
    const maxVolumeInput = screen.getByLabelText(/maximum volume/i);

    fireEvent.change(minVolumeInput, { target: { value: '100' } });
    expect(minVolumeInput).toHaveValue(100);

    fireEvent.change(maxVolumeInput, { target: { value: '1000' } });
    expect(maxVolumeInput).toHaveValue(1000);
  });

  it('should have unique IDs for all membership radio buttons', () => {
    render(<FilterPanel {...defaultProps} />);

    const allRadio = document.getElementById('membership-all');
    const membersRadio = document.getElementById('membership-members');
    const f2pRadio = document.getElementById('membership-f2p');

    expect(allRadio).toBeInTheDocument();
    expect(membersRadio).toBeInTheDocument();
    expect(f2pRadio).toBeInTheDocument();

    expect(allRadio?.getAttribute('type')).toBe('radio');
    expect(membersRadio?.getAttribute('type')).toBe('radio');
    expect(f2pRadio?.getAttribute('type')).toBe('radio');
  });
});

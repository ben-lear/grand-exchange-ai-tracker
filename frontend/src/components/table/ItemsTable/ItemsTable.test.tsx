/**
 * Tests for ItemsTable component
 */

import type { ItemWithPrice } from '@/components/table/columns';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ItemsTable } from './ItemsTable';

// Mock data
const mockItem: ItemWithPrice = {
  itemId: 1,
  name: 'Abyssal whip',
  iconUrl: 'https://example.com/icon.png',
  members: true,
  buyLimit: 70,
  highAlch: 72000,
  lowAlch: 48000,
  currentPrice: {
    itemId: 1,
    highPrice: 2500000,
    lowPrice: 2400000,
    highPriceTime: '2024-01-15T10:00:00Z',
    lowPriceTime: '2024-01-15T09:55:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  id: 1,
  description: 'A weapon from the abyss.',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockData = [mockItem];

describe('ItemsTable', () => {
  it('renders loading state', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={[]} isLoading={true} enableVirtualization={false} />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading items...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = new Error('Failed to fetch');
    render(
      <MemoryRouter>
        <ItemsTable data={[]} error={error} enableVirtualization={false} />
      </MemoryRouter>
    );
    expect(screen.getByText('Failed to load items')).toBeInTheDocument();
    // The actual error message is now in the description within the Alert component
  });

  it('renders empty state', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={[]} enableVirtualization={false} />
      </MemoryRouter>
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search query')).toBeInTheDocument();
  });

  it('renders data correctly', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={mockData} enableVirtualization={false} />
      </MemoryRouter>
    );

    // Check if item name is rendered
    expect(screen.getByText('Abyssal whip')).toBeInTheDocument();

    // Check if prices are formatted correctly
    expect(screen.getAllByText('2.5M')).toBeDefined(); // High price / Current price
    // Low price is formatted with formatNumber, not formatGold, so it will be "2,400,000"
    expect(screen.getByText('2,400,000')).toBeInTheDocument(); // Low price

    // Check if members badge is shown
    expect(screen.getByText('P2P')).toBeInTheDocument();
  });

  it('handles column sorting', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={mockData} enableVirtualization={false} />
      </MemoryRouter>
    );

    // Find and click the name column header (get all buttons with 'item' text, first one is the header)
    const buttons = screen.getAllByRole('button');
    const nameHeader = buttons.find(btn => btn.textContent?.includes('Item') && btn.querySelector('.lucide-arrow-up-down'));
    expect(nameHeader).toBeDefined();

    if (nameHeader) {
      fireEvent.click(nameHeader);
      // Should show sort indicator
      // Lucide icons render as SVGs with specific classes
      expect(nameHeader.querySelector('.lucide-arrow-up')).toBeInTheDocument();
    }
  });

  it('renders item name as a clickable link', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={mockData} enableVirtualization={false} />
      </MemoryRouter>
    );

    // Check that the item name is a link
    const itemLink = screen.getByRole('link', { name: 'Abyssal whip' });
    expect(itemLink).toBeInTheDocument();
    expect(itemLink).toHaveAttribute('href', '/items/1/abyssal-whip');
  });

  it('does not trigger navigation when clicking on table row', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={mockData} enableVirtualization={false} />
      </MemoryRouter>
    );

    // Find the table row
    const itemName = screen.getByText('Abyssal whip');
    const tableRow = itemName.closest('tr');

    // Verify row doesn't have cursor-pointer class
    expect(tableRow).not.toHaveClass('cursor-pointer');

    // Verify row doesn't have onClick handler by checking it doesn't have cursor-pointer
    // The row should only have hover styling, not clickable styling
    expect(tableRow?.className).toContain('hover:bg-gray-50');
  });

  it('shows item count information', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={mockData} enableVirtualization={false} />
      </MemoryRouter>
    );
    expect(screen.getByText('Showing 1 of 1 items')).toBeInTheDocument();
  });

  it('displays correct column count', () => {
    render(
      <MemoryRouter>
        <ItemsTable data={mockData} enableVirtualization={false} />
      </MemoryRouter>
    );

    // Should have visible columns for name, prices, and members
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThan(4); // At least item, high price, low price, avg price, members
  });

  it('renders F2P badge for non-members items', () => {
    const f2pItem = { ...mockItem, members: false };
    render(
      <MemoryRouter>
        <ItemsTable data={[f2pItem]} enableVirtualization={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('F2P')).toBeInTheDocument();
  });
});
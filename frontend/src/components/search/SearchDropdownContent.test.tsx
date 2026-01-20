/**
 * SearchDropdownContent component tests
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Item } from '../../types';
import { SearchDropdownContent, type SearchDropdownContentProps } from './SearchDropdownContent';

interface MockRecentItem {
  itemId: number;
  name: string;
  icon: string;
}

const mockRecentItems: MockRecentItem[] = [
  { itemId: 1, name: 'Dragon scimitar', icon: 'icon1.png' },
  { itemId: 2, name: 'Abyssal whip', icon: 'icon2.png' },
];

const mockSearchResults: Item[] = [
  {
    id: 1,
    itemId: 100,
    name: 'Twisted bow',
    iconUrl: 'icon100.png',
    description: 'A bow',
    members: true,
    buyLimit: 8,
    lowAlch: 1000,
    highAlch: 1500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    itemId: 101,
    name: 'Scythe of vitur',
    iconUrl: 'icon101.png',
    description: 'A scythe',
    members: true,
    buyLimit: 8,
    lowAlch: 2000,
    highAlch: 3000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const defaultProps: SearchDropdownContentProps<MockRecentItem> = {
  showRecent: false,
  showResults: false,
  showNoResults: false,
  recentItems: mockRecentItems,
  searchResults: mockSearchResults,
  selectedIndex: 0,
  query: 'dragon',
  onSelectItem: vi.fn(),
  onHoverItem: vi.fn(),
  renderRecentItem: (item) => <span data-testid={`recent-${item.itemId}`}>{item.name}</span>,
  renderResultItem: (item) => <span data-testid={`result-${item.itemId}`}>{item.name}</span>,
  onRemoveRecent: vi.fn(),
};

describe('SearchDropdownContent', () => {
  it('should render nothing when all show flags are false', () => {
    const { container } = render(
      <ul>
        <SearchDropdownContent {...defaultProps} />
      </ul>
    );

    expect(container.querySelector('li')).toBeNull();
  });

  describe('Recent searches', () => {
    it('should render recent searches header and items', () => {
      render(
        <ul>
          <SearchDropdownContent {...defaultProps} showRecent={true} />
        </ul>
      );

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByTestId('recent-1')).toHaveTextContent('Dragon scimitar');
      expect(screen.getByTestId('recent-2')).toHaveTextContent('Abyssal whip');
    });

    it('should use custom recent header text', () => {
      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showRecent={true}
            recentHeader="Recent Items"
          />
        </ul>
      );

      expect(screen.getByText('Recent Items')).toBeInTheDocument();
    });

    it('should call onSelectItem when recent item is clicked', async () => {
      const user = userEvent.setup();
      const onSelectItem = vi.fn();

      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showRecent={true}
            onSelectItem={onSelectItem}
          />
        </ul>
      );

      await user.click(screen.getByTestId('recent-1'));

      expect(onSelectItem).toHaveBeenCalledWith(mockRecentItems[0]);
    });

    it('should call onHoverItem when hovering over recent item', async () => {
      const user = userEvent.setup();
      const onHoverItem = vi.fn();

      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showRecent={true}
            onHoverItem={onHoverItem}
          />
        </ul>
      );

      await user.hover(screen.getByTestId('recent-1').closest('li')!);

      expect(onHoverItem).toHaveBeenCalledWith(0);
    });

    it('should highlight selected recent item', () => {
      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showRecent={true}
            selectedIndex={1}
          />
        </ul>
      );

      const secondItem = screen.getByTestId('recent-2').closest('li');
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Search results', () => {
    it('should render search result items', () => {
      render(
        <ul>
          <SearchDropdownContent {...defaultProps} showResults={true} />
        </ul>
      );

      expect(screen.getByTestId('result-100')).toHaveTextContent('Twisted bow');
      expect(screen.getByTestId('result-101')).toHaveTextContent('Scythe of vitur');
    });

    it('should call onSelectItem when result item is clicked', async () => {
      const user = userEvent.setup();
      const onSelectItem = vi.fn();

      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showResults={true}
            onSelectItem={onSelectItem}
          />
        </ul>
      );

      await user.click(screen.getByTestId('result-100'));

      expect(onSelectItem).toHaveBeenCalledWith(mockSearchResults[0]);
    });

    it('should highlight selected search result', () => {
      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showResults={true}
            selectedIndex={0}
          />
        </ul>
      );

      const firstItem = screen.getByTestId('result-100').closest('li');
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('No results', () => {
    it('should render no results message with query', () => {
      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showNoResults={true}
            query="xyz123"
          />
        </ul>
      );

      expect(screen.getByText(/No items found for "xyz123"/)).toBeInTheDocument();
    });
  });

  describe('renderRecentItem with onRemove', () => {
    it('should pass onRemove to renderRecentItem', () => {
      const renderRecentItem = vi.fn((item, onRemove) => (
        <span data-testid={`recent-${item.itemId}`}>
          {item.name}
          {onRemove && <button onClick={() => onRemove(item.itemId)}>Remove</button>}
        </span>
      ));
      const onRemoveRecent = vi.fn();

      render(
        <ul>
          <SearchDropdownContent
            {...defaultProps}
            showRecent={true}
            renderRecentItem={renderRecentItem}
            onRemoveRecent={onRemoveRecent}
          />
        </ul>
      );

      expect(renderRecentItem).toHaveBeenCalledWith(mockRecentItems[0], onRemoveRecent);
      expect(renderRecentItem).toHaveBeenCalledWith(mockRecentItems[1], onRemoveRecent);
    });
  });
});

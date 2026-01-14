/**
 * Item type definitions for OSRS Grand Exchange items
 */

export interface Item {
  /** Database primary key */
  id: number;
  /** OSRS item ID */
  itemId: number;
  /** Item name */
  name: string;
  /** Description of the item */
  description: string;
  /** Icon URL (from OSRS wiki) */
  iconUrl: string;
  /** Whether item is members-only */
  members: boolean;
  /** Grand Exchange buy limit per 4 hours */
  buyLimit: number;
  /** High alchemy value in GP */
  highAlch: number;
  /** Low alchemy value in GP */
  lowAlch: number;
  /** Timestamp when item was created */
  createdAt: string;
  /** Timestamp when item was last updated */
  updatedAt: string;
}

/**
 * Simplified item data for list views
 */
export interface ItemSummary {
  id: number;
  itemId: number;
  name: string;
  iconUrl: string;
  members: boolean;
}

/**
 * Item filters for API queries
 */
export interface ItemFilters {
  /** Search query for item name */
  search?: string;
  /** Filter by members-only items */
  members?: boolean;
  /** Minimum buy limit */
  minBuyLimit?: number;
  /** Maximum buy limit */
  maxBuyLimit?: number;
  /** Sort field */
  sortBy?: 'name' | 'itemId' | 'buyLimit' | 'highAlch' | 'members';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response for item listings
 */
export interface ItemListResponse {
  items: Item[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Item count response
 */
export interface ItemCountResponse {
  count: number;
  filters?: ItemFilters;
}

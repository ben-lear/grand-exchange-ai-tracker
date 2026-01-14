/**
 * Zustand store for favorite items
 * Persisted to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Favorite item data
 */
export interface FavoriteItem {
  /** Item ID */
  itemId: number;
  /** Item name (for display) */
  name: string;
  /** Icon URL */
  iconUrl: string;
  /** When this item was favorited */
  addedAt: number;
}

/**
 * Favorites store state
 */
interface FavoritesState {
  /** Map of item ID to favorite item */
  favorites: Record<number, FavoriteItem>;
}

/**
 * Favorites store actions
 */
interface FavoritesActions {
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (itemId: number) => void;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  isFavorite: (itemId: number) => boolean;
  getFavorites: () => FavoriteItem[];
  getFavoritesCount: () => number;
  clearFavorites: () => void;
}

/**
 * Favorites store
 */
export const useFavoritesStore = create<FavoritesState & FavoritesActions>()(
  persist(
    (set, get) => ({
      favorites: {},
      
      addFavorite: (item) => 
        set((state) => ({
          favorites: {
            ...state.favorites,
            [item.itemId]: {
              ...item,
              addedAt: Date.now(),
            },
          },
        })),
      
      removeFavorite: (itemId) => 
        set((state) => {
          const newFavorites = { ...state.favorites };
          delete newFavorites[itemId];
          return { favorites: newFavorites };
        }),
      
      toggleFavorite: (item) => {
        const state = get();
        if (state.favorites[item.itemId]) {
          state.removeFavorite(item.itemId);
        } else {
          state.addFavorite(item);
        }
      },
      
      isFavorite: (itemId) => {
        const state = get();
        return itemId in state.favorites;
      },
      
      getFavorites: () => {
        const state = get();
        return Object.values(state.favorites).sort((a, b) => b.addedAt - a.addedAt);
      },
      
      getFavoritesCount: () => {
        const state = get();
        return Object.keys(state.favorites).length;
      },
      
      clearFavorites: () => set({ favorites: {} }),
    }),
    {
      name: 'osrs-ge-tracker-favorites',
    }
  )
);

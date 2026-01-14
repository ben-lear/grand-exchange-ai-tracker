import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistItem } from '../types';

interface WatchlistState {
  watchlist: WatchlistItem[];
  addToWatchlist: (itemId: number) => void;
  removeFromWatchlist: (itemId: number) => void;
  isInWatchlist: (itemId: number) => boolean;
  clearWatchlist: () => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      addToWatchlist: (itemId) =>
        set((state) => {
          // Don't add duplicates
          if (state.watchlist.some((item) => item.itemId === itemId)) {
            return state;
          }
          return {
            watchlist: [
              ...state.watchlist,
              { itemId, addedAt: new Date().toISOString() },
            ],
          };
        }),
      removeFromWatchlist: (itemId) =>
        set((state) => ({
          watchlist: state.watchlist.filter((item) => item.itemId !== itemId),
        })),
      isInWatchlist: (itemId) =>
        get().watchlist.some((item) => item.itemId === itemId),
      clearWatchlist: () => set({ watchlist: [] }),
    }),
    {
      name: 'osrs-watchlist',
    }
  )
);

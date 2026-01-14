import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItemFilters } from '../types';

interface FilterState {
  filters: ItemFilters;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<ItemFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: ItemFilters = {
  search: '',
  type: '',
  members: null,
  sortBy: 'name',
  sortOrder: 'asc',
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      searchQuery: '',
      setSearchQuery: (query) => 
        set((state) => ({
          searchQuery: query,
          filters: { ...state.filters, search: query },
        })),
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters, searchQuery: '' }),
    }),
    {
      name: 'osrs-filters',
    }
  )
);

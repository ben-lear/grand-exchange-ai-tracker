import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItemFilters } from '../types';

interface FilterState {
  filters: ItemFilters;
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
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'osrs-filters',
    }
  )
);

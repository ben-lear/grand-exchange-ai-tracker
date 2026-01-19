import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ColumnVisibilityState {
    visibleColumns: string[];
    toggleColumn: (columnId: string) => void;
    showAll: () => void;
    hideAll: () => void;
    resetToDefaults: () => void;
}

// Columns that align with frontend/src/components/table/columns.tsx
export const DEFAULT_COLUMNS = ['pin', 'favorite', 'watchlist', 'name', 'highPrice', 'lowPrice', 'avgPrice', 'members', 'buyLimit'];
export const ALL_COLUMNS = ['pin', 'favorite', 'watchlist', 'name', 'highPrice', 'lowPrice', 'avgPrice', 'members', 'buyLimit', 'highAlch'];

export const useColumnVisibilityStore = create<ColumnVisibilityState>()(
    persist(
        (set) => ({
            visibleColumns: DEFAULT_COLUMNS,
            toggleColumn: (columnId) =>
                set((state) => ({
                    visibleColumns: state.visibleColumns.includes(columnId)
                        ? state.visibleColumns.filter((id) => id !== columnId)
                        : [...state.visibleColumns, columnId],
                })),
            showAll: () =>
                set({ visibleColumns: ALL_COLUMNS }),
            hideAll: () => set({ visibleColumns: ['name'] }), // Always show name
            resetToDefaults: () => set({ visibleColumns: DEFAULT_COLUMNS }),
        }),
        { name: 'column-visibility' }
    )
);

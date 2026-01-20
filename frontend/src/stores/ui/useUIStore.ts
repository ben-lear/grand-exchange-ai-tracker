/**
 * Zustand store for UI state (non-persistent)
 */

import { create } from 'zustand';

/**
 * UI state
 */
interface UIState {
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Mobile menu open state */
  mobileMenuOpen: boolean;
  /** Filters panel open state */
  filtersPanelOpen: boolean;
  /** Loading overlay visible */
  loading: boolean;
  /** Loading message */
  loadingMessage?: string;
}

/**
 * UI actions
 */
interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleFiltersPanel: () => void;
  setFiltersPanelOpen: (open: boolean) => void;
  setLoading: (loading: boolean, message?: string) => void;
}

/**
 * UI store
 */
export const useUIStore = create<UIState & UIActions>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  filtersPanelOpen: false,
  loading: false,
  loadingMessage: undefined,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  toggleFiltersPanel: () => set((state) => ({ filtersPanelOpen: !state.filtersPanelOpen })),
  setFiltersPanelOpen: (open) => set({ filtersPanelOpen: open }),

  setLoading: (loading, message) => set({ loading, loadingMessage: message }),
}));

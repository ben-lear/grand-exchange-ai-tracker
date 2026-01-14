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
  /** Search modal open state */
  searchModalOpen: boolean;
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
  toggleSearchModal: () => void;
  setSearchModalOpen: (open: boolean) => void;
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
  searchModalOpen: false,
  filtersPanelOpen: false,
  loading: false,
  loadingMessage: undefined,
  
  // Actions
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  toggleSearchModal: () => set((state) => ({ searchModalOpen: !state.searchModalOpen })),
  setSearchModalOpen: (open) => set({ searchModalOpen: open }),
  
  toggleFiltersPanel: () => set((state) => ({ filtersPanelOpen: !state.filtersPanelOpen })),
  setFiltersPanelOpen: (open) => set({ filtersPanelOpen: open }),
  
  setLoading: (loading, message) => set({ loading, loadingMessage: message }),
}));

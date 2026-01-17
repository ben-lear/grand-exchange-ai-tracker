/**
 * Tests for useUIStore
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.setState({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      filtersPanelOpen: false,
      loading: false,
      loadingMessage: undefined,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const state = useUIStore.getState();
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.mobileMenuOpen).toBe(false);
      expect(state.filtersPanelOpen).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.loadingMessage).toBeUndefined();
    });
  });

  describe('Sidebar', () => {
    it('should toggle sidebar', () => {
      const { toggleSidebar } = useUIStore.getState();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed state', () => {
      const { setSidebarCollapsed } = useUIStore.getState();

      setSidebarCollapsed(true);
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      setSidebarCollapsed(false);
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('Mobile Menu', () => {
    it('should toggle mobile menu', () => {
      const { toggleMobileMenu } = useUIStore.getState();
      expect(useUIStore.getState().mobileMenuOpen).toBe(false);

      toggleMobileMenu();
      expect(useUIStore.getState().mobileMenuOpen).toBe(true);

      toggleMobileMenu();
      expect(useUIStore.getState().mobileMenuOpen).toBe(false);
    });

    it('should set mobile menu open state', () => {
      const { setMobileMenuOpen } = useUIStore.getState();

      setMobileMenuOpen(true);
      expect(useUIStore.getState().mobileMenuOpen).toBe(true);

      setMobileMenuOpen(false);
      expect(useUIStore.getState().mobileMenuOpen).toBe(false);
    });
  });

  describe('Filters Panel', () => {
    it('should toggle filters panel', () => {
      const { toggleFiltersPanel } = useUIStore.getState();
      expect(useUIStore.getState().filtersPanelOpen).toBe(false);

      toggleFiltersPanel();
      expect(useUIStore.getState().filtersPanelOpen).toBe(true);

      toggleFiltersPanel();
      expect(useUIStore.getState().filtersPanelOpen).toBe(false);
    });

    it('should set filters panel open state', () => {
      const { setFiltersPanelOpen } = useUIStore.getState();

      setFiltersPanelOpen(true);
      expect(useUIStore.getState().filtersPanelOpen).toBe(true);

      setFiltersPanelOpen(false);
      expect(useUIStore.getState().filtersPanelOpen).toBe(false);
    });
  });

  describe('Loading', () => {
    it('should set loading state without message', () => {
      const { setLoading } = useUIStore.getState();

      setLoading(true);
      const state1 = useUIStore.getState();
      expect(state1.loading).toBe(true);
      expect(state1.loadingMessage).toBeUndefined();

      setLoading(false);
      const state2 = useUIStore.getState();
      expect(state2.loading).toBe(false);
      expect(state2.loadingMessage).toBeUndefined();
    });

    it('should set loading state with message', () => {
      const { setLoading } = useUIStore.getState();

      setLoading(true, 'Loading items...');
      const state = useUIStore.getState();
      expect(state.loading).toBe(true);
      expect(state.loadingMessage).toBe('Loading items...');
    });

    it('should clear loading message when loading is false', () => {
      const { setLoading } = useUIStore.getState();

      setLoading(true, 'Processing...');
      expect(useUIStore.getState().loadingMessage).toBe('Processing...');

      setLoading(false);
      expect(useUIStore.getState().loading).toBe(false);
    });
  });
});

/**
 * Tests for usePreferencesStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferencesStore } from './usePreferencesStore';

describe('usePreferencesStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePreferencesStore.setState({
      theme: 'system',
      table: {
        pageSize: 100,
        columnVisibility: {
          icon: true,
          name: true,
          price: true,
          change24h: true,
          volume: true,
          buyLimit: true,
          highAlch: false,
          lowAlch: false,
          members: true,
          lastUpdated: true,
        },
        sortBy: 'name',
        sortOrder: 'asc',
        virtualScrolling: true,
        compactMode: false,
      },
      chart: {
        defaultPeriod: '7d',
        showVolume: true,
        smoothLines: true,
        showGrid: true,
      },
      autoRefresh: true,
      notifications: {
        enabled: false,
        priceAlerts: false,
        volumeAlerts: false,
      },
    });
  });

  describe('Theme', () => {
    it('should have default theme as system', () => {
      const state = usePreferencesStore.getState();
      expect(state.theme).toBe('system');
    });

    it('should set theme to light', () => {
      const { setTheme } = usePreferencesStore.getState();
      setTheme('light');
      expect(usePreferencesStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      const { setTheme } = usePreferencesStore.getState();
      setTheme('dark');
      expect(usePreferencesStore.getState().theme).toBe('dark');
    });
  });

  describe('Table Preferences', () => {
    it('should have default page size of 100', () => {
      const state = usePreferencesStore.getState();
      expect(state.table.pageSize).toBe(100);
    });

    it('should update page size', () => {
      const { setTablePreferences } = usePreferencesStore.getState();
      setTablePreferences({ pageSize: 200 });
      expect(usePreferencesStore.getState().table.pageSize).toBe(200);
    });

    it('should update column visibility', () => {
      const { setColumnVisibility } = usePreferencesStore.getState();
      setColumnVisibility('highAlch', true);
      setColumnVisibility('lowAlch', true);
      const state = usePreferencesStore.getState();
      expect(state.table.columnVisibility.highAlch).toBe(true);
      expect(state.table.columnVisibility.lowAlch).toBe(true);
      expect(state.table.columnVisibility.icon).toBe(true); // unchanged
    });

    it('should update sort preferences', () => {
      const { setTablePreferences } = usePreferencesStore.getState();
      setTablePreferences({ sortBy: 'price', sortOrder: 'asc' });
      const state = usePreferencesStore.getState();
      expect(state.table.sortBy).toBe('price');
      expect(state.table.sortOrder).toBe('asc');
    });

    it('should toggle virtual scrolling', () => {
      const { setTablePreferences } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().table.virtualScrolling;
      setTablePreferences({ virtualScrolling: !initialValue });
      expect(usePreferencesStore.getState().table.virtualScrolling).toBe(!initialValue);
    });

    it('should toggle compact mode', () => {
      const { setTablePreferences } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().table.compactMode;
      setTablePreferences({ compactMode: !initialValue });
      expect(usePreferencesStore.getState().table.compactMode).toBe(!initialValue);
    });
  });

  describe('Chart Preferences', () => {
    it('should have default period of 7d', () => {
      const state = usePreferencesStore.getState();
      expect(state.chart.defaultPeriod).toBe('7d');
    });

    it('should update default period', () => {
      const { setChartPreferences } = usePreferencesStore.getState();
      setChartPreferences({ defaultPeriod: '30d' });
      expect(usePreferencesStore.getState().chart.defaultPeriod).toBe('30d');
    });

    it('should toggle show volume', () => {
      const { setChartPreferences } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().chart.showVolume;
      setChartPreferences({ showVolume: !initialValue });
      expect(usePreferencesStore.getState().chart.showVolume).toBe(!initialValue);
    });

    it('should toggle smooth lines', () => {
      const { setChartPreferences } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().chart.smoothLines;
      setChartPreferences({ smoothLines: !initialValue });
      expect(usePreferencesStore.getState().chart.smoothLines).toBe(!initialValue);
    });

    it('should toggle grid', () => {
      const { setChartPreferences } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().chart.showGrid;
      setChartPreferences({ showGrid: !initialValue });
      expect(usePreferencesStore.getState().chart.showGrid).toBe(!initialValue);
    });
  });

  describe('Notification Preferences', () => {
    it('should have default notification settings', () => {
      const state = usePreferencesStore.getState();
      expect(state.notifications.priceAlerts).toBe(false);
      expect(state.notifications.enabled).toBe(false);
      expect(state.notifications.volumeAlerts).toBe(false);
    });

    it('should toggle price alerts', () => {
      const { setNotifications } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().notifications.priceAlerts;
      setNotifications({ priceAlerts: !initialValue });
      expect(usePreferencesStore.getState().notifications.priceAlerts).toBe(!initialValue);
    });

    it('should toggle enabled', () => {
      const { setNotifications } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().notifications.enabled;
      setNotifications({ enabled: !initialValue });
      expect(usePreferencesStore.getState().notifications.enabled).toBe(!initialValue);
    });

    it('should toggle volume alerts', () => {
      const { setNotifications } = usePreferencesStore.getState();
      const initialValue = usePreferencesStore.getState().notifications.volumeAlerts;
      setNotifications({ volumeAlerts: !initialValue });
      expect(usePreferencesStore.getState().notifications.volumeAlerts).toBe(!initialValue);
    });
  });

  describe('Reset', () => {
    it('should reset all preferences to defaults', () => {
      const { setTheme, setTablePreferences, resetToDefaults } = usePreferencesStore.getState();
      
      // Change some values
      setTheme('dark');
      setTablePreferences({ pageSize: 200 });
      
      // Reset
      resetToDefaults();
      
      const state = usePreferencesStore.getState();
      expect(state.theme).toBe('system');
      expect(state.table.pageSize).toBe(100);
    });
  });
});

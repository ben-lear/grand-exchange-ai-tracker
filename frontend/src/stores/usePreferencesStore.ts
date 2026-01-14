/**
 * Zustand store for user preferences
 * Persisted to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Table column visibility settings
 */
export interface ColumnVisibility {
  icon: boolean;
  name: boolean;
  price: boolean;
  change24h: boolean;
  volume: boolean;
  buyLimit: boolean;
  highAlch: boolean;
  lowAlch: boolean;
  members: boolean;
  lastUpdated: boolean;
}

/**
 * Table preferences
 */
export interface TablePreferences {
  /** Page size for pagination */
  pageSize: number;
  /** Column visibility */
  columnVisibility: ColumnVisibility;
  /** Default sort field */
  sortBy: string;
  /** Default sort direction */
  sortOrder: 'asc' | 'desc';
  /** Enable virtual scrolling */
  virtualScrolling: boolean;
  /** Compact mode (smaller rows) */
  compactMode: boolean;
}

/**
 * Chart preferences
 */
export interface ChartPreferences {
  /** Default time period */
  defaultPeriod: '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
  /** Show volume chart by default */
  showVolume: boolean;
  /** Smooth chart lines */
  smoothLines: boolean;
  /** Show grid lines */
  showGrid: boolean;
}

/**
 * Preferences store state
 */
interface PreferencesState {
  /** Color theme */
  theme: Theme;
  /** Table preferences */
  table: TablePreferences;
  /** Chart preferences */
  chart: ChartPreferences;
  /** Auto-refresh enabled */
  autoRefresh: boolean;
  /** Notification preferences */
  notifications: {
    enabled: boolean;
    priceAlerts: boolean;
    volumeAlerts: boolean;
  };
}

/**
 * Preferences store actions
 */
interface PreferencesActions {
  setTheme: (theme: Theme) => void;
  setTablePreferences: (preferences: Partial<TablePreferences>) => void;
  setChartPreferences: (preferences: Partial<ChartPreferences>) => void;
  setColumnVisibility: (column: keyof ColumnVisibility, visible: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setNotifications: (notifications: Partial<PreferencesState['notifications']>) => void;
  resetToDefaults: () => void;
}

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: PreferencesState = {
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
};

/**
 * Preferences store
 */
export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      
      setTheme: (theme) => set({ theme }),
      
      setTablePreferences: (preferences) => 
        set((state) => ({
          table: { ...state.table, ...preferences },
        })),
      
      setChartPreferences: (preferences) => 
        set((state) => ({
          chart: { ...state.chart, ...preferences },
        })),
      
      setColumnVisibility: (column, visible) => 
        set((state) => ({
          table: {
            ...state.table,
            columnVisibility: {
              ...state.table.columnVisibility,
              [column]: visible,
            },
          },
        })),
      
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      
      setNotifications: (notifications) => 
        set((state) => ({
          notifications: { ...state.notifications, ...notifications },
        })),
      
      resetToDefaults: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'osrs-ge-tracker-preferences',
    }
  )
);

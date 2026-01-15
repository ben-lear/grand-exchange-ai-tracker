export type TimePeriod = '1h' | '12h' | '24h' | '3d' | '7d' | '30d' | '90d' | '1y' | 'all';

export interface TimestepConfig {
  period: TimePeriod;
  displayTimestepMs: number;
  consolidationThreshold: number;
}

export const TIMESTEP_CONFIG: Record<TimePeriod, TimestepConfig> = {
  '1h': { period: '1h', displayTimestepMs: 1 * 60 * 1000, consolidationThreshold: 1 },
  '12h': { period: '12h', displayTimestepMs: 2 * 60 * 1000, consolidationThreshold: 2 },
  '24h': { period: '24h', displayTimestepMs: 5 * 60 * 1000, consolidationThreshold: 5 },
  '3d': { period: '3d', displayTimestepMs: 15 * 60 * 1000, consolidationThreshold: 15 },
  '7d': { period: '7d', displayTimestepMs: 30 * 60 * 1000, consolidationThreshold: 30 },
  '30d': { period: '30d', displayTimestepMs: 2 * 60 * 60 * 1000, consolidationThreshold: 120 },
  '90d': { period: '90d', displayTimestepMs: 6 * 60 * 60 * 1000, consolidationThreshold: 360 },
  '1y': { period: '1y', displayTimestepMs: 24 * 60 * 60 * 1000, consolidationThreshold: 1440 },
  all: { period: 'all', displayTimestepMs: 24 * 60 * 60 * 1000, consolidationThreshold: 1440 },
};

export function getTimestepForPeriod(period: TimePeriod): TimestepConfig {
  return TIMESTEP_CONFIG[period];
}

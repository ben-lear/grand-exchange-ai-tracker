import { create } from 'zustand';

export interface LivePricePoint {
  timestamp: Date;
  high: number | null;
  low: number | null;
  isLive: true;
}

interface LiveBuffer {
  points: LivePricePoint[];
  latestPoint: LivePricePoint | null;
}

export interface LiveBufferState {
  buffers: Map<number, LiveBuffer>;

  maxPointsPerItem: number;

  addPoint: (itemId: number, point: LivePricePoint) => void;
  getBuffer: (itemId: number) => LiveBuffer | undefined;
  getLiveTip: (itemId: number) => LivePricePoint | null;
  getConsolidatedPoints: (itemId: number, timestepMs: number) => LivePricePoint[];
  clearBuffer: (itemId: number) => void;
  clearAllBuffers: () => void;
}

function avgNullable(values: Array<number | null>): number | null {
  let sum = 0;
  let count = 0;
  for (const v of values) {
    if (v == null) continue;
    sum += v;
    count++;
  }
  return count === 0 ? null : sum / count;
}

export const useLiveBufferStore = create<LiveBufferState>((set, get) => ({
  buffers: new Map(),
  maxPointsPerItem: 500,

  addPoint: (itemId, point) => {
    set((state) => {
      const buffers = new Map(state.buffers);
      const existing = buffers.get(itemId) ?? { points: [], latestPoint: null };

      const nextPoints = [...existing.points, point];
      const overflow = nextPoints.length - state.maxPointsPerItem;
      const pruned = overflow > 0 ? nextPoints.slice(overflow) : nextPoints;

      buffers.set(itemId, { points: pruned, latestPoint: point });
      return { buffers };
    });
  },

  getBuffer: (itemId) => get().buffers.get(itemId),

  getLiveTip: (itemId) => get().buffers.get(itemId)?.latestPoint ?? null,

  getConsolidatedPoints: (itemId, timestepMs) => {
    const buffer = get().buffers.get(itemId);
    if (!buffer || buffer.points.length === 0) return [];

    const buckets = new Map<number, LivePricePoint[]>();

    for (const p of buffer.points) {
      const ts = p.timestamp.getTime();
      const bucketKey = Math.floor(ts / timestepMs) * timestepMs;
      const arr = buckets.get(bucketKey);
      if (arr) arr.push(p);
      else buckets.set(bucketKey, [p]);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucketStart, points]) => ({
        timestamp: new Date(bucketStart),
        high: avgNullable(points.map((p) => p.high)),
        low: avgNullable(points.map((p) => p.low)),
        isLive: true as const,
      }));
  },

  clearBuffer: (itemId) => {
    set((state) => {
      const buffers = new Map(state.buffers);
      buffers.delete(itemId);
      return { buffers };
    });
  },

  clearAllBuffers: () => set({ buffers: new Map() }),
}));

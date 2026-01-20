import { useEffect, useMemo, useRef, useState } from 'react';

export interface PriceUpdate {
  item_id: number;
  high: number | null;
  low: number | null;
  high_time: number | null;
  low_time: number | null;
  timestamp: string;
}

export interface UsePriceStreamOptions {
  itemIds?: number[];
  enabled?: boolean;
  onUpdate?: (update: PriceUpdate) => void;
}

export interface UsePriceStreamReturn {
  isConnected: boolean;
  lastUpdate: PriceUpdate | null;
  connectionError: Error | null;
  reconnectCount: number;
  lastHeartbeatAt: Date | null;
}

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export function usePriceStream(options: UsePriceStreamOptions): UsePriceStreamReturn {
  const enabled = options.enabled ?? true;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<PriceUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<Date | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const closedByCleanupRef = useRef(false);

  const url = useMemo(() => {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
    const params =
      options.itemIds && options.itemIds.length > 0 ? `?items=${options.itemIds.join(',')}` : '';
    return `${base}/prices/stream${params}`;
  }, [options.itemIds]);

  useEffect(() => {
    if (!enabled) return;

    closedByCleanupRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const cleanupEventSource = () => {
      esRef.current?.close();
      esRef.current = null;
    };

    const scheduleReconnect = () => {
      clearReconnectTimer();
      const attempt = reconnectCount;
      const delay = Math.min(RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt), RECONNECT_MAX_DELAY_MS);

      reconnectTimerRef.current = window.setTimeout(() => {
        setReconnectCount((c) => c + 1);
        connect();
      }, delay);
    };

    const connect = () => {
      cleanupEventSource();

      try {
        const es = new EventSource(url);
        esRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
          setConnectionError(null);
          // keep reconnectCount as-is (useful for UI)
        };

        es.addEventListener('price-update', (e) => {
          try {
            const update = JSON.parse((e as MessageEvent).data) as PriceUpdate;
            setLastUpdate(update);
            options.onUpdate?.(update);
          } catch (err) {
            setConnectionError(err instanceof Error ? err : new Error('Failed to parse price-update'));
          }
        });

        es.addEventListener('heartbeat', () => {
          setLastHeartbeatAt(new Date());
        });

        es.onerror = () => {
          setIsConnected(false);

          if (closedByCleanupRef.current) return;

          cleanupEventSource();
          scheduleReconnect();
        };
      } catch (err) {
        setIsConnected(false);
        setConnectionError(err instanceof Error ? err : new Error('Failed to create EventSource'));
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      closedByCleanupRef.current = true;
      clearReconnectTimer();
      cleanupEventSource();
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options.onUpdate is a callback that shouldn't trigger re-renders
  }, [enabled, url]);

  return { isConnected, lastUpdate, connectionError, reconnectCount, lastHeartbeatAt };
}

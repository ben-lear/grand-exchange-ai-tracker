import { formatDistanceToNow } from 'date-fns';

export interface LiveIndicatorProps {
  isConnected: boolean;
  lastUpdateTime: Date | null;
  reconnectCount?: number;
}

export function LiveIndicator({ isConnected, lastUpdateTime, reconnectCount }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`h-2 w-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}
      />
      <span className={isConnected ? 'text-green-600' : 'text-gray-500'}>
        {isConnected ? 'LIVE' : 'Connecting...'}
      </span>
      {typeof reconnectCount === 'number' && reconnectCount > 0 && (
        <span className="text-gray-400 text-xs">retries: {reconnectCount}</span>
      )}
      {lastUpdateTime && (
        <span className="text-gray-400 text-xs">
          Updated {formatDistanceToNow(lastUpdateTime, { addSuffix: true })}
        </span>
      )}
    </div>
  );
}

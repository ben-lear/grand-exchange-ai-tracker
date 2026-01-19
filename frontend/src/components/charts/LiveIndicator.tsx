import { formatDistanceToNow } from 'date-fns';
import { Stack, Text } from '../ui';

export interface LiveIndicatorProps {
  isConnected: boolean;
  lastUpdateTime: Date | null;
  reconnectCount?: number;
}

export function LiveIndicator({ isConnected, lastUpdateTime, reconnectCount }: LiveIndicatorProps) {
  return (
    <Stack direction="row" align="center" gap={2} className="text-sm">
      <span
        className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
      />
      <Text className={isConnected ? 'text-green-600' : 'text-gray-500'}>
        {isConnected ? 'LIVE' : 'Connecting...'}
      </Text>
      {typeof reconnectCount === 'number' && reconnectCount > 0 && (
        <Text variant="muted" size="xs">retries: {reconnectCount}</Text>
      )}
      {lastUpdateTime && (
        <Text variant="muted" size="xs">
          Updated {formatDistanceToNow(lastUpdateTime, { addSuffix: true })}
        </Text>
      )}
    </Stack>
  );
}

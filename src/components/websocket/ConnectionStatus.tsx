// WebSocket connection status indicator component

import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showLabel = true,
}) => {
  const { connectionStatus } = useWebSocket();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
        };
      case 'connecting':
        return {
          icon: Loader2,
          label: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600 animate-spin',
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Connection Error',
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-600',
        };
      default:
        return {
          icon: WifiOff,
          label: 'Disconnected',
          variant: 'secondary' as const,
          className: 'bg-gray-500 hover:bg-gray-600',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {showLabel && <span className="text-xs">{config.label}</span>}
    </Badge>
  );
};


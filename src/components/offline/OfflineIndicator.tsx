// Offline indicator component

import React, { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { syncService } from '@/services/syncService';
import { actionQueue } from '@/services/actionQueue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className,
  showDetails = false,
}) => {
  const { isOnline, wasOffline } = useOffline();
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Update queue size
  useEffect(() => {
    const updateQueueSize = async () => {
      if (!isOnline) {
        const size = await actionQueue.size();
        setQueueSize(size);
      } else {
        setQueueSize(0);
      }
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 2000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && queueSize > 0) {
      handleSync();
    }
  }, [isOnline, wasOffline, queueSize]);

  // Listen for sync events
  useEffect(() => {
    const unsubscribe = syncService.onSync(() => {
      actionQueue.size().then(size => setQueueSize(size));
    });

    return unsubscribe;
  }, []);

  const handleSync = async () => {
    if (syncing || !isOnline) return;

    setSyncing(true);
    try {
      const result = await syncService.sync();
      
      if (result.processed > 0) {
        toast({
          title: 'Sync completed',
          description: `Successfully synced ${result.processed} action(s)`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: 'Sync completed with errors',
          description: `${result.failed} action(s) failed to sync`,
          variant: 'destructive',
        });
      }

      const newSize = await actionQueue.size();
      setQueueSize(newSize);
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync failed',
        description: 'Failed to sync queued actions',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!isOnline ? (
        <Badge
          variant="destructive"
          className="flex items-center gap-1.5 px-2 py-1"
        >
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">Offline</span>
          {queueSize > 0 && (
            <span className="text-xs">({queueSize} queued)</span>
          )}
        </Badge>
      ) : queueSize > 0 ? (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        >
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs">{queueSize} pending</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 ml-1"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </Badge>
      ) : wasOffline ? (
        <Badge
          variant="default"
          className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-800"
        >
          <Wifi className="h-3 w-3" />
          <span className="text-xs">Back online</span>
        </Badge>
      ) : null}

      {showDetails && queueSize > 0 && (
        <div className="text-xs text-muted-foreground">
          {queueSize} action{queueSize !== 1 ? 's' : ''} queued
        </div>
      )}
    </div>
  );
};


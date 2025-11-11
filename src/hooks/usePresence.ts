// Hook for tracking and displaying presence (viewers/editors)

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket, WebSocketEventType } from './useWebSocket';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveViewer {
  userId: string;
  userName: string;
  userAvatar?: string;
}

interface ActiveEditor {
  userId: string;
  userName: string;
  userAvatar?: string;
  cellId?: string;
  columnId?: string;
}

interface UsePresenceOptions {
  itemId?: string;
  cellId?: string;
  enabled?: boolean;
}

export const usePresence = (options: UsePresenceOptions = {}) => {
  const { itemId, cellId, enabled = true } = options;
  const { user } = useAuth();
  const { isConnected, on, off } = useWebSocket({ enabled });
  const [viewers, setViewers] = useState<ActiveViewer[]>([]);
  const [editors, setEditors] = useState<ActiveEditor[]>([]);
  const [cellEditors, setCellEditors] = useState<ActiveEditor[]>([]);

  // Track viewing
  const trackViewing = useCallback(() => {
    if (!enabled || !isConnected || !itemId || !user) return;

    // Send view event via WebSocket
    // In a real implementation, this would send a message to the server
    // For now, we'll just track locally
  }, [enabled, isConnected, itemId, user]);

  // Track editing
  const trackEditing = useCallback(() => {
    if (!enabled || !isConnected || !itemId || !user) return;

    // Send edit event via WebSocket
    // In a real implementation, this would send a message to the server
  }, [enabled, isConnected, itemId, user]);

  // Stop tracking editing
  const stopTrackingEditing = useCallback(() => {
    if (!enabled || !isConnected || !itemId || !user) return;

    // Send stop edit event via WebSocket
  }, [enabled, isConnected, itemId, user]);

  // Listen for presence updates
  useEffect(() => {
    if (!enabled || !isConnected || !itemId) return;

    const unsubscribeViewers = on('presence:viewers_changed', (message) => {
      const payload = message.payload as { itemId: string; viewers: ActiveViewer[] };
      if (payload.itemId === itemId) {
        setViewers(payload.viewers);
      }
    });

    const unsubscribeEditors = on('presence:editors_changed', (message) => {
      const payload = message.payload as {
        itemId: string;
        cellId?: string;
        itemEditors: ActiveEditor[];
        cellEditors: ActiveEditor[];
      };
      if (payload.itemId === itemId) {
        setEditors(payload.itemEditors);
        if (cellId && payload.cellId === cellId) {
          setCellEditors(payload.cellEditors);
        }
      }
    });

    return () => {
      unsubscribeViewers();
      unsubscribeEditors();
    };
  }, [enabled, isConnected, itemId, cellId, on, off]);

  // Auto-track viewing when itemId changes
  useEffect(() => {
    if (itemId) {
      trackViewing();
    }
  }, [itemId, trackViewing]);

  return {
    viewers,
    editors,
    cellEditors,
    trackViewing,
    trackEditing,
    stopTrackingEditing,
  };
};


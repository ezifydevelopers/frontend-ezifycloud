// WebSocket client hook for real-time updates

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/config';

export enum WebSocketEventType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  ITEM_CREATED = 'item:created',
  ITEM_UPDATED = 'item:updated',
  ITEM_DELETED = 'item:deleted',
  ITEM_STATUS_CHANGED = 'item:status_changed',
  COMMENT_ADDED = 'comment:added',
  APPROVAL_REQUESTED = 'approval:requested',
  APPROVAL_APPROVED = 'approval:approved',
  APPROVAL_REJECTED = 'approval:rejected',
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  PRESENCE_VIEWERS_CHANGED = 'presence:viewers_changed',
  PRESENCE_EDITORS_CHANGED = 'presence:editors_changed',
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  CONFLICT_DETECTED = 'conflict:detected',
  ERROR = 'error',
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
  userId?: string;
  boardId?: string;
  workspaceId?: string;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

interface UseWebSocketOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { enabled = true, onConnect, onDisconnect, onError } = options;
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<WebSocketEventHandler>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  const pingInterval = 25000; // 25 seconds

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_BASE_URL.replace(/^https?:\/\//, '').replace(/\/api$/, '');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${wsProtocol}//${wsHost}/ws${tokenParam}`;
  }, [token]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || !user || !token) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      setConnectionStatus('connecting');
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: WebSocketEventType.PING,
              payload: {},
              timestamp: new Date().toISOString(),
            }));
          }
        }, pingInterval);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle pong
          if (message.type === WebSocketEventType.PONG) {
            return;
          }

          // Handle connect confirmation
          if (message.type === WebSocketEventType.CONNECT) {
            console.log('✅ WebSocket connection confirmed');
            return;
          }

          // Call registered event handlers
          const handlers = eventHandlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(message);
              } catch (error) {
                console.error(`Error in WebSocket event handler for ${message.type}:`, error);
              }
            });
          }

          // Also call handlers for 'all' events
          const allHandlers = eventHandlersRef.current.get('*');
          if (allHandlers) {
            allHandlers.forEach(handler => {
              try {
                handler(message);
              } catch (error) {
                console.error('Error in WebSocket all-events handler:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
        onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * reconnectAttemptsRef.current;
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
      onError?.(error as Error);
    }
  }, [enabled, user, token, getWebSocketUrl, onConnect, onDisconnect, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Subscribe to board
  const subscribeToBoard = useCallback((boardId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe:board',
        payload: { boardId },
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  // Unsubscribe from board
  const unsubscribeFromBoard = useCallback((boardId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe:board',
        payload: { boardId },
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  // Subscribe to workspace
  const subscribeToWorkspace = useCallback((workspaceId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe:workspace',
        payload: { workspaceId },
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  // Unsubscribe from workspace
  const unsubscribeFromWorkspace = useCallback((workspaceId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe:workspace',
        payload: { workspaceId },
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  // Register event handler
  const on = useCallback((eventType: string | '*', handler: WebSocketEventHandler) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }
    eventHandlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  // Unregister event handler
  const off = useCallback((eventType: string | '*', handler: WebSocketEventHandler) => {
    const handlers = eventHandlersRef.current.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(eventType);
      }
    }
  }, []);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled && user && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, user, token, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    subscribeToBoard,
    unsubscribeFromBoard,
    subscribeToWorkspace,
    unsubscribeFromWorkspace,
    on,
    off,
  };
};


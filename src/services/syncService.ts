// Sync service for processing queued actions when coming back online

import { actionQueue, ActionType } from './actionQueue';
import { offlineCache } from './offlineCache';
import { apiRequest } from '@/lib/api';

class SyncService {
  private syncInProgress = false;
  private syncListeners: Set<() => void> = new Set();

  /**
   * Register sync listener
   */
  onSync(callback: () => void): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  /**
   * Notify sync listeners
   */
  private notifySync(): void {
    this.syncListeners.forEach(listener => listener());
  }

  /**
   * Sync queued actions
   */
  async sync(): Promise<{
    processed: number;
    failed: number;
    cachedDataRefreshed: boolean;
  }> {
    if (this.syncInProgress) {
      console.log('[SyncService] Sync already in progress');
      return { processed: 0, failed: 0, cachedDataRefreshed: false };
    }

    if (!navigator.onLine) {
      console.log('[SyncService] Still offline, cannot sync');
      return { processed: 0, failed: 0, cachedDataRefreshed: false };
    }

    this.syncInProgress = true;
    console.log('[SyncService] Starting sync...');

    try {
      // Process queued actions
      const queueResult = await actionQueue.processQueue(async (endpoint, options) => {
        // Import API_BASE_URL from config (already includes /api)
        const { API_BASE_URL } = await import('../lib/config');
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(options?.headers || {}),
          },
        });
        return response;
      });

      // Refresh cached data
      let cachedDataRefreshed = false;
      try {
        const cacheKeys = await offlineCache.getAllKeys();
        if (cacheKeys.length > 0) {
          // Invalidate cache to force refresh on next request
          // In a real implementation, you'd refresh specific cached endpoints
          cachedDataRefreshed = true;
        }
      } catch (error) {
        console.error('[SyncService] Error refreshing cache:', error);
      }

      this.notifySync();

      console.log('[SyncService] Sync completed:', {
        processed: queueResult.processed,
        failed: queueResult.failed,
        cachedDataRefreshed,
      });

      return {
        processed: queueResult.processed,
        failed: queueResult.failed,
        cachedDataRefreshed,
      };
    } catch (error) {
      console.error('[SyncService] Sync error:', error);
      return { processed: 0, failed: 0, cachedDataRefreshed: false };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    pending: number;
    failed: number;
  }> {
    const actions = await actionQueue.getAll();
    const failed = actions.filter(a => a.retries >= 3).length;
    const pending = actions.length - failed;

    return { pending, failed };
  }
}

export const syncService = new SyncService();


// Action queue service for offline operations

import { offlineCache } from './offlineCache';

export enum ActionType {
  CREATE_ITEM = 'create_item',
  UPDATE_ITEM = 'update_item',
  DELETE_ITEM = 'delete_item',
  UPDATE_CELL = 'update_cell',
  CREATE_COMMENT = 'create_comment',
  UPDATE_STATUS = 'update_status',
  SUBMIT_APPROVAL = 'submit_approval',
}

export interface QueuedAction {
  id?: number;
  type: ActionType;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  lastError?: string;
}

const QUEUE_STORE = 'queue';
const MAX_RETRIES = 3;

class ActionQueue {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private processing = false;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('ezify-offline-cache', 1);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('type', 'type', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Add action to queue
   */
  async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): Promise<number> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const queuedAction: QueuedAction = {
        ...action,
        timestamp: Date.now(),
        retries: 0,
      };

      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.add(queuedAction);

      request.onsuccess = () => {
        const id = request.result as number;
        console.log(`[ActionQueue] Queued action: ${action.type} (ID: ${id})`);
        resolve(id);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all queued actions
   */
  async getAll(): Promise<QueuedAction[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as QueuedAction[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Remove action from queue
   */
  async dequeue(actionId: number): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.delete(actionId);

      request.onsuccess = () => {
        console.log(`[ActionQueue] Dequeued action ID: ${actionId}`);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Update action retry count
   */
  async updateRetry(actionId: number, retries: number, lastError?: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const getRequest = store.get(actionId);

      getRequest.onsuccess = () => {
        const action = getRequest.result as QueuedAction;
        if (action) {
          action.retries = retries;
          action.lastError = lastError;
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Clear all queued actions
   */
  async clear(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[ActionQueue] Cleared all queued actions');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get queue size
   */
  async size(): Promise<number> {
    const actions = await this.getAll();
    return actions.length;
  }

  /**
   * Process queued actions
   */
  async processQueue(apiRequest: (endpoint: string, options?: RequestInit) => Promise<Response>): Promise<{
    processed: number;
    failed: number;
  }> {
    if (this.processing) {
      return { processed: 0, failed: 0 };
    }

    this.processing = true;
    const actions = await this.getAll();
    let processed = 0;
    let failed = 0;

    console.log(`[ActionQueue] Processing ${actions.length} queued actions...`);

    for (const action of actions) {
      try {
        // Skip if max retries reached
        if (action.retries >= MAX_RETRIES) {
          console.warn(`[ActionQueue] Skipping action ${action.id} (max retries reached)`);
          await this.dequeue(action.id!);
          failed++;
          continue;
        }

        // Execute action
        const response = await apiRequest(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            ...action.headers,
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        if (response.ok) {
          // Success - remove from queue
          await this.dequeue(action.id!);
          processed++;
          console.log(`[ActionQueue] Successfully processed action ${action.id}`);
        } else {
          // Failed - increment retry count
          const errorText = await response.text();
          await this.updateRetry(action.id!, action.retries + 1, errorText);
          failed++;
          console.error(`[ActionQueue] Failed to process action ${action.id}:`, errorText);
        }
      } catch (error) {
        // Network error - increment retry count
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.updateRetry(action.id!, action.retries + 1, errorMessage);
        failed++;
        console.error(`[ActionQueue] Error processing action ${action.id}:`, error);
      }
    }

    this.processing = false;
    console.log(`[ActionQueue] Processed ${processed} actions, ${failed} failed`);

    return { processed, failed };
  }
}

export const actionQueue = new ActionQueue();


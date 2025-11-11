// Offline data caching service using IndexedDB

const DB_NAME = 'ezify-offline-cache';
const DB_VERSION = 1;

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
}

class OfflineCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', {
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
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined,
      };

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all cache keys
   */
  async getAllKeys(): Promise<string[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<number> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(0);
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expiresAt');
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export const offlineCache = new OfflineCache();


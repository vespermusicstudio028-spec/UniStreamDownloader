/**
 * Simple in-memory cache with TTL.
 * Used to avoid redundant yt-dlp calls for the same URL.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number = 600) {
    this.ttlMs = ttlSeconds * 1000;
    // Periodic cleanup every 5 minutes
    setInterval(() => this.evict(), 5 * 60 * 1000);
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      data: value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton cache for media metadata (TTL: 10 minutes)
export const metadataCache = new SimpleCache<any>(600);

// Singleton cache for URL validation results (TTL: 5 minutes)
export const urlCache = new SimpleCache<boolean>(300);

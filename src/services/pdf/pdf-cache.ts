import { createHash } from 'crypto';
import { Logger } from '@/lib/logger';

interface CacheEntry {
  data: Buffer;
  expiresAt: number;
}

/**
 * PdfCache provides in-memory caching for generated PDFs with TTL support.
 * In production, this can be extended to use Redis.
 */
export class PdfCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;
  private logger: Logger;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(ttlSeconds: number = 86400) {
    this.ttlMs = ttlSeconds * 1000;
    this.logger = new Logger('PdfCache');
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from resume ID, template, and content
   */
  static generateKey(resumeId: string, template: string, contentHash: string): string {
    return `pdf:${resumeId}:${template}:${contentHash}`;
  }

  /**
   * Generate content hash
   */
  static hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get PDF from cache
   */
  get(key: string): Buffer | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache entry expired: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data;
  }

  /**
   * Set PDF in cache
   */
  set(key: string, pdf: Buffer, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.ttlMs;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      data: pdf,
      expiresAt,
    });

    this.logger.debug(`Cache set: ${key}, expires in ${ttl}ms`);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Cache invalidated: ${key}`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared, removed ${size} entries`);
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleanup: removed ${removedCount} expired entries`);
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    this.logger.info('Cache destroyed');
  }
}

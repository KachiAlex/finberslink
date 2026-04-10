/**
 * Resume Completion Feature Caching Strategy
 * 
 * Cache durations:
 * - Export history: 1 hour (invalidate on new export)
 * - Analytics summaries: 30 minutes (real-time for last 24 hours)
 * - Share link validation: 5 minutes
 * - Version history: 1 hour
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ResumeCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
    };
  }

  /**
   * Destroy cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

const resumeCache = new ResumeCache();

/**
 * Cache keys for resume completion feature
 */
export const CACHE_KEYS = {
  // Export history: 1 hour
  exportHistory: (resumeId: string) => `export-history:${resumeId}`,
  exportStatistics: (resumeId: string) => `export-stats:${resumeId}`,

  // Analytics: 30 minutes
  analytics: (resumeId: string) => `analytics:${resumeId}`,
  analyticsSummary: (resumeId: string) => `analytics-summary:${resumeId}`,
  recentViewers: (resumeId: string) => `recent-viewers:${resumeId}`,

  // Share links: 5 minutes
  shareLinks: (resumeId: string) => `share-links:${resumeId}`,
  shareSummary: (resumeId: string) => `share-summary:${resumeId}`,
  shareToken: (token: string) => `share-token:${token}`,

  // Versions: 1 hour
  versionHistory: (resumeId: string) => `version-history:${resumeId}`,

  // Notifications: 30 minutes
  notifications: (userId: string) => `notifications:${userId}`,
  unreadCount: (userId: string) => `unread-count:${userId}`,
};

/**
 * Cache TTLs (in milliseconds)
 */
export const CACHE_TTL = {
  exportHistory: 60 * 60 * 1000, // 1 hour
  analytics: 30 * 60 * 1000, // 30 minutes
  shareLinks: 5 * 60 * 1000, // 5 minutes
  versionHistory: 60 * 60 * 1000, // 1 hour
  notifications: 30 * 60 * 1000, // 30 minutes
};

/**
 * Get cached export history
 */
export function getCachedExportHistory<T>(resumeId: string): T | null {
  return resumeCache.get<T>(CACHE_KEYS.exportHistory(resumeId));
}

/**
 * Set cached export history
 */
export function setCachedExportHistory<T>(resumeId: string, data: T): void {
  resumeCache.set(CACHE_KEYS.exportHistory(resumeId), data, CACHE_TTL.exportHistory);
}

/**
 * Invalidate export history cache
 */
export function invalidateExportHistory(resumeId: string): void {
  resumeCache.invalidate(CACHE_KEYS.exportHistory(resumeId));
  resumeCache.invalidate(CACHE_KEYS.exportStatistics(resumeId));
}

/**
 * Get cached analytics
 */
export function getCachedAnalytics<T>(resumeId: string): T | null {
  return resumeCache.get<T>(CACHE_KEYS.analytics(resumeId));
}

/**
 * Set cached analytics
 */
export function setCachedAnalytics<T>(resumeId: string, data: T): void {
  resumeCache.set(CACHE_KEYS.analytics(resumeId), data, CACHE_TTL.analytics);
}

/**
 * Invalidate analytics cache
 */
export function invalidateAnalytics(resumeId: string): void {
  resumeCache.invalidate(CACHE_KEYS.analytics(resumeId));
  resumeCache.invalidate(CACHE_KEYS.analyticsSummary(resumeId));
  resumeCache.invalidate(CACHE_KEYS.recentViewers(resumeId));
}

/**
 * Get cached share links
 */
export function getCachedShareLinks<T>(resumeId: string): T | null {
  return resumeCache.get<T>(CACHE_KEYS.shareLinks(resumeId));
}

/**
 * Set cached share links
 */
export function setCachedShareLinks<T>(resumeId: string, data: T): void {
  resumeCache.set(CACHE_KEYS.shareLinks(resumeId), data, CACHE_TTL.shareLinks);
}

/**
 * Invalidate share links cache
 */
export function invalidateShareLinks(resumeId: string): void {
  resumeCache.invalidate(CACHE_KEYS.shareLinks(resumeId));
  resumeCache.invalidate(CACHE_KEYS.shareSummary(resumeId));
}

/**
 * Get cached version history
 */
export function getCachedVersionHistory<T>(resumeId: string): T | null {
  return resumeCache.get<T>(CACHE_KEYS.versionHistory(resumeId));
}

/**
 * Set cached version history
 */
export function setCachedVersionHistory<T>(resumeId: string, data: T): void {
  resumeCache.set(CACHE_KEYS.versionHistory(resumeId), data, CACHE_TTL.versionHistory);
}

/**
 * Invalidate version history cache
 */
export function invalidateVersionHistory(resumeId: string): void {
  resumeCache.invalidate(CACHE_KEYS.versionHistory(resumeId));
}

/**
 * Get cached notifications
 */
export function getCachedNotifications<T>(userId: string): T | null {
  return resumeCache.get<T>(CACHE_KEYS.notifications(userId));
}

/**
 * Set cached notifications
 */
export function setCachedNotifications<T>(userId: string, data: T): void {
  resumeCache.set(CACHE_KEYS.notifications(userId), data, CACHE_TTL.notifications);
}

/**
 * Invalidate notifications cache
 */
export function invalidateNotifications(userId: string): void {
  resumeCache.invalidate(CACHE_KEYS.notifications(userId));
  resumeCache.invalidate(CACHE_KEYS.unreadCount(userId));
}

/**
 * Clear all resume cache
 */
export function clearResumeCache(): void {
  resumeCache.clear();
}

/**
 * Get cache stats
 */
export function getResumeCacheStats() {
  return resumeCache.getStats();
}

export default resumeCache;

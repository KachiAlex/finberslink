/**
 * Cache Manager for Resume Completion Feature
 * Task 63: Implement caching strategy
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  // Cache TTL configurations (in milliseconds)
  private readonly TTL = {
    exportHistory: 60 * 60 * 1000, // 1 hour
    analyticsSummary: 30 * 60 * 1000, // 30 minutes
    shareLinkValidation: 5 * 60 * 1000, // 5 minutes
    versionHistory: 60 * 60 * 1000, // 1 hour
  };

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
  set<T>(key: string, data: T, ttl: number = this.TTL.exportHistory): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Cache export history
   */
  cacheExportHistory(resumeId: string, data: any): void {
    this.set(`export-history:${resumeId}`, data, this.TTL.exportHistory);
  }

  /**
   * Get cached export history
   */
  getExportHistory(resumeId: string): any | null {
    return this.get(`export-history:${resumeId}`);
  }

  /**
   * Invalidate export history cache
   */
  invalidateExportHistory(resumeId: string): void {
    this.cache.delete(`export-history:${resumeId}`);
  }

  /**
   * Cache analytics summary
   */
  cacheAnalyticsSummary(resumeId: string, data: any): void {
    this.set(
      `analytics-summary:${resumeId}`,
      data,
      this.TTL.analyticsSummary
    );
  }

  /**
   * Get cached analytics summary
   */
  getAnalyticsSummary(resumeId: string): any | null {
    return this.get(`analytics-summary:${resumeId}`);
  }

  /**
   * Invalidate analytics summary cache
   */
  invalidateAnalyticsSummary(resumeId: string): void {
    this.cache.delete(`analytics-summary:${resumeId}`);
  }

  /**
   * Cache share link validation
   */
  cacheShareLinkValidation(shareToken: string, isValid: boolean): void {
    this.set(
      `share-link-valid:${shareToken}`,
      isValid,
      this.TTL.shareLinkValidation
    );
  }

  /**
   * Get cached share link validation
   */
  getShareLinkValidation(shareToken: string): boolean | null {
    return this.get(`share-link-valid:${shareToken}`);
  }

  /**
   * Invalidate share link validation cache
   */
  invalidateShareLinkValidation(shareToken: string): void {
    this.cache.delete(`share-link-valid:${shareToken}`);
  }

  /**
   * Cache version history
   */
  cacheVersionHistory(resumeId: string, data: any): void {
    this.set(`version-history:${resumeId}`, data, this.TTL.versionHistory);
  }

  /**
   * Get cached version history
   */
  getVersionHistory(resumeId: string): any | null {
    return this.get(`version-history:${resumeId}`);
  }

  /**
   * Invalidate version history cache
   */
  invalidateVersionHistory(resumeId: string): void {
    this.cache.delete(`version-history:${resumeId}`);
  }

  /**
   * Invalidate all caches for a resume
   */
  invalidateResumeCache(resumeId: string): void {
    this.invalidateExportHistory(resumeId);
    this.invalidateAnalyticsSummary(resumeId);
    this.invalidateVersionHistory(resumeId);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    entries: Array<{ key: string; expiresIn: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, entry.expiresAt - now),
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

export const cacheManager = new CacheManager();

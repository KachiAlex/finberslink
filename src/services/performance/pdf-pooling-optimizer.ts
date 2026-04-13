/**
 * PDF Pooling Optimizer Service
 * 
 * Optimizes Puppeteer connection pooling with advanced queue management,
 * resource monitoring, and performance metrics.
 */

import { Logger } from '@/lib/logger';

const logger = new Logger('PdfPoolingOptimizer');

interface PooledBrowser {
  browser: any;
  page: any;
  inUse: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  requestCount: number;
}

interface PoolMetrics {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
  queuedRequests: number;
  averageWaitTime: number;
  totalProcessed: number;
  failureRate: number;
}

/**
 * Advanced PDF Pool Manager with resource optimization
 */
export class PdfPoolManager {
  private pool: Map<string, PooledBrowser> = new Map();
  private maxPoolSize: number;
  private maxPageAge: number; // milliseconds
  private requestQueue: Array<{
    resolve: (page: any) => void;
    reject: (error: Error) => void;
    timestamp: Date;
  }> = [];
  private metrics = {
    totalRequests: 0,
    totalProcessed: 0,
    totalFailed: 0,
    totalWaitTime: 0,
    createdAt: Date.now(),
  };
  private browser: any = null;

  constructor(maxPoolSize: number = 5, maxPageAge: number = 300000) {
    this.maxPoolSize = maxPoolSize;
    this.maxPageAge = maxPageAge; // 5 minutes default
  }

  /**
   * Initialize the pool
   */
  async initialize(): Promise<void> {
    try {
      const puppeteer = await import('puppeteer');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-resources',
          '--disable-extensions',
        ],
      });
      logger.info(`PDF pool initialized with max size: ${this.maxPoolSize}`);
    } catch (error) {
      logger.error('Failed to initialize PDF pool', error);
      throw error;
    }
  }

  /**
   * Acquire a page from the pool
   */
  async acquirePage(): Promise<any> {
    this.metrics.totalRequests++;

    // Try to get an idle page from the pool
    const idlePage = this.getIdlePage();
    if (idlePage) {
      logger.debug('Reusing pooled page');
      return idlePage;
    }

    // If pool not full, create new page
    if (this.pool.size < this.maxPoolSize) {
      return this.createNewPage();
    }

    // Queue the request and wait
    return this.queueRequest();
  }

  /**
   * Release a page back to the pool
   */
  async releasePage(page: any): Promise<void> {
    try {
      // Find the page in the pool
      for (const [id, pooledBrowser] of this.pool.entries()) {
        if (pooledBrowser.page === page) {
          pooledBrowser.inUse = false;
          pooledBrowser.lastUsedAt = new Date();
          logger.debug('Page released back to pool');

          // Process queued requests
          this.processQueuedRequests();
          return;
        }
      }

      // If not in pool, close it
      await page.close();
    } catch (error) {
      logger.error('Error releasing page', error);
    }
  }

  /**
   * Get an idle page from the pool
   */
  private getIdlePage(): any | null {
    const now = Date.now();

    for (const [id, pooledBrowser] of this.pool.entries()) {
      // Check if page is idle and not too old
      if (
        !pooledBrowser.inUse &&
        now - pooledBrowser.createdAt.getTime() < this.maxPageAge
      ) {
        pooledBrowser.inUse = true;
        pooledBrowser.requestCount++;
        return pooledBrowser.page;
      }
    }

    return null;
  }

  /**
   * Create a new page
   */
  private async createNewPage(): Promise<any> {
    try {
      const page = await this.browser.newPage();
      const id = `page-${Date.now()}-${Math.random()}`;

      this.pool.set(id, {
        browser: this.browser,
        page,
        inUse: true,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        requestCount: 1,
      });

      logger.debug(`Created new page. Pool size: ${this.pool.size}`);
      return page;
    } catch (error) {
      logger.error('Error creating new page', error);
      this.metrics.totalFailed++;
      throw error;
    }
  }

  /**
   * Queue a request for when a page becomes available
   */
  private queueRequest(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        timestamp: new Date(),
      });

      logger.debug(`Request queued. Queue size: ${this.requestQueue.length}`);

      // Set timeout for queued requests (30 seconds)
      setTimeout(() => {
        const index = this.requestQueue.findIndex(r => r.resolve === resolve);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Request timeout - pool exhausted'));
          this.metrics.totalFailed++;
        }
      }, 30000);
    });
  }

  /**
   * Process queued requests
   */
  private async processQueuedRequests(): Promise<void> {
    while (this.requestQueue.length > 0) {
      const idlePage = this.getIdlePage();
      if (!idlePage) {
        break;
      }

      const request = this.requestQueue.shift();
      if (request) {
        const waitTime = Date.now() - request.timestamp.getTime();
        this.metrics.totalWaitTime += waitTime;
        this.metrics.totalProcessed++;

        request.resolve(idlePage);
      }
    }
  }

  /**
   * Clean up old pages from the pool
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, pooledBrowser] of this.pool.entries()) {
      // Remove pages that are too old or have been used too many times
      if (
        !pooledBrowser.inUse &&
        (now - pooledBrowser.createdAt.getTime() > this.maxPageAge ||
          pooledBrowser.requestCount > 100)
      ) {
        try {
          await pooledBrowser.page.close();
          this.pool.delete(id);
          cleaned++;
          logger.debug(`Cleaned up old page: ${id}`);
        } catch (error) {
          logger.error(`Error cleaning up page ${id}`, error);
        }
      }
    }

    return cleaned;
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    const activeInstances = Array.from(this.pool.values()).filter(p => p.inUse).length;
    const idleInstances = this.pool.size - activeInstances;
    const failureRate =
      this.metrics.totalRequests > 0
        ? (this.metrics.totalFailed / this.metrics.totalRequests) * 100
        : 0;
    const averageWaitTime =
      this.metrics.totalProcessed > 0
        ? this.metrics.totalWaitTime / this.metrics.totalProcessed
        : 0;

    return {
      totalInstances: this.pool.size,
      activeInstances,
      idleInstances,
      queuedRequests: this.requestQueue.length,
      averageWaitTime,
      totalProcessed: this.metrics.totalProcessed,
      failureRate,
    };
  }

  /**
   * Close the pool
   */
  async close(): Promise<void> {
    try {
      // Close all pages
      for (const [id, pooledBrowser] of this.pool.entries()) {
        try {
          await pooledBrowser.page.close();
        } catch (error) {
          logger.error(`Error closing page ${id}`, error);
        }
      }

      this.pool.clear();

      // Close browser
      if (this.browser) {
        await this.browser.close();
      }

      logger.info('PDF pool closed');
    } catch (error) {
      logger.error('Error closing PDF pool', error);
    }
  }

  /**
   * Get pool status
   */
  getStatus(): {
    poolSize: number;
    maxPoolSize: number;
    activePages: number;
    idlePages: number;
    queuedRequests: number;
    uptime: number;
  } {
    const activeInstances = Array.from(this.pool.values()).filter(p => p.inUse).length;
    const idleInstances = this.pool.size - activeInstances;

    return {
      poolSize: this.pool.size,
      maxPoolSize: this.maxPoolSize,
      activePages: activeInstances,
      idlePages: idleInstances,
      queuedRequests: this.requestQueue.length,
      uptime: Date.now() - this.metrics.createdAt,
    };
  }
}

// Export singleton instance
let poolManager: PdfPoolManager | null = null;

export async function getPdfPoolManager(): Promise<PdfPoolManager> {
  if (!poolManager) {
    poolManager = new PdfPoolManager(5, 300000); // 5 max instances, 5 min page age
    await poolManager.initialize();

    // Start cleanup interval (every 5 minutes)
    setInterval(async () => {
      try {
        const cleaned = await poolManager!.cleanup();
        if (cleaned > 0) {
          logger.debug(`Cleanup removed ${cleaned} old pages`);
        }
      } catch (error) {
        logger.error('Error in cleanup interval', error);
      }
    }, 300000);
  }

  return poolManager;
}

export async function closePdfPoolManager(): Promise<void> {
  if (poolManager) {
    await poolManager.close();
    poolManager = null;
  }
}

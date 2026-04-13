/**
 * Optimized PDF Service
 * 
 * Enhanced PDF service using advanced pooling, caching, and performance optimization.
 */

import { PdfCache } from '../pdf/pdf-cache';
import { S3Storage } from '../pdf/s3-storage';
import { Logger } from '@/lib/logger';
import { getPdfPoolManager, closePdfPoolManager } from './pdf-pooling-optimizer';
import { setCachedValue, getCachedValue } from './query-optimizer';

const logger = new Logger('OptimizedPdfService');

export interface OptimizedPdfExportOptions {
  resumeId: string;
  template: 'Modern' | 'Classic' | 'Minimal';
  htmlContent: string;
  fileName: string;
  metadata?: Record<string, string>;
}

export interface OptimizedPdfExportResult {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  generatedAt: string;
  s3Key?: string;
  cachedFromRedis?: boolean;
  cachedFromMemory?: boolean;
}

/**
 * Optimized PDF Service with advanced pooling and caching
 */
export class OptimizedPdfService {
  private pdfCache: PdfCache;
  private s3Storage: S3Storage | null;
  private initialized: boolean = false;

  constructor(pdfCache: PdfCache, s3Storage?: S3Storage) {
    this.pdfCache = pdfCache;
    this.s3Storage = s3Storage || null;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      const poolManager = await getPdfPoolManager();
      this.initialized = true;
      logger.info('Optimized PDF service initialized');
    } catch (error) {
      logger.error('Failed to initialize optimized PDF service', error);
      throw error;
    }
  }

  /**
   * Export resume as PDF with multi-level caching and pooling
   */
  async exportResumePdf(
    options: OptimizedPdfExportOptions
  ): Promise<OptimizedPdfExportResult> {
    if (!this.initialized) {
      throw new Error('Optimized PDF service not initialized. Call initialize() first.');
    }

    try {
      const contentHash = PdfCache.hashContent(options.htmlContent);
      const cacheKey = PdfCache.generateKey(options.resumeId, options.template, contentHash);
      const redisCacheKey = `pdf:${cacheKey}`;

      // Level 1: Check Redis cache
      let pdfBuffer = await getCachedValue<Buffer>(redisCacheKey);
      if (pdfBuffer) {
        logger.debug(`Redis cache hit for resume ${options.resumeId}`);
        return this.buildExportResult(
          pdfBuffer,
          options,
          true,
          false
        );
      }

      // Level 2: Check memory cache
      pdfBuffer = this.pdfCache.get(cacheKey);
      if (pdfBuffer) {
        logger.debug(`Memory cache hit for resume ${options.resumeId}`);
        // Populate Redis cache for next time
        await setCachedValue(redisCacheKey, pdfBuffer, 86400);
        return this.buildExportResult(
          pdfBuffer,
          options,
          false,
          true
        );
      }

      // Level 3: Generate PDF using optimized pool
      logger.debug(`Generating PDF for resume ${options.resumeId}`);
      pdfBuffer = await this.generatePdfWithPool(options.htmlContent);

      // Store in both caches
      this.pdfCache.set(cacheKey, pdfBuffer);
      await setCachedValue(redisCacheKey, pdfBuffer, 86400);

      return this.buildExportResult(
        pdfBuffer,
        options,
        false,
        false
      );
    } catch (error) {
      logger.error(`Error exporting resume PDF: ${options.resumeId}`, error);
      throw error;
    }
  }

  /**
   * Generate PDF using optimized pool manager
   */
  private async generatePdfWithPool(htmlContent: string): Promise<Buffer> {
    const poolManager = await getPdfPoolManager();
    const page = await poolManager.acquirePage();

    try {
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
      });

      // Set content with timeout
      await Promise.race([
        page.setContent(htmlContent, { waitUntil: 'networkidle0' }),
        this.createTimeout(30000, 'Content loading timeout'),
      ]);

      // Generate PDF with timeout
      const pdfBuffer = await Promise.race([
        page.pdf({
          format: 'A4',
          margin: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          },
          printBackground: true,
        }),
        this.createTimeout(30000, 'PDF generation timeout'),
      ]);

      logger.debug('PDF generated successfully using pool');
      return pdfBuffer as Buffer;
    } finally {
      await poolManager.releasePage(page);
    }
  }

  /**
   * Build export result
   */
  private async buildExportResult(
    pdfBuffer: Buffer,
    options: OptimizedPdfExportOptions,
    cachedFromRedis: boolean,
    cachedFromMemory: boolean
  ): Promise<OptimizedPdfExportResult> {
    // Upload to S3 if configured
    let s3Key: string | undefined;
    if (this.s3Storage) {
      s3Key = await this.s3Storage.uploadPdf(pdfBuffer, options.fileName, {
        resumeId: options.resumeId,
        template: options.template,
        ...options.metadata,
      });
    }

    // Get download URL
    let downloadUrl: string;
    if (this.s3Storage && s3Key) {
      downloadUrl = await this.s3Storage.getPdfUrl(s3Key);
    } else {
      // Fallback: return base64 encoded PDF for download
      downloadUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    }

    logger.info(
      `Resume PDF exported: ${options.resumeId}, size: ${pdfBuffer.length} bytes, cached: ${cachedFromRedis || cachedFromMemory}`
    );

    return {
      downloadUrl,
      fileName: options.fileName,
      fileSize: pdfBuffer.length,
      generatedAt: new Date().toISOString(),
      s3Key,
      cachedFromRedis,
      cachedFromMemory,
    };
  }

  /**
   * Invalidate cached PDF
   */
  async invalidateCache(
    resumeId: string,
    template: string,
    contentHash: string
  ): Promise<void> {
    const cacheKey = PdfCache.generateKey(resumeId, template, contentHash);
    const redisCacheKey = `pdf:${cacheKey}`;

    this.pdfCache.invalidate(cacheKey);
    // Note: Redis invalidation would require Redis client access
    logger.info(`Cache invalidated for resume ${resumeId}`);
  }

  /**
   * Get pool metrics
   */
  async getPoolMetrics() {
    const poolManager = await getPdfPoolManager();
    return poolManager.getMetrics();
  }

  /**
   * Get pool status
   */
  async getPoolStatus() {
    const poolManager = await getPdfPoolManager();
    return poolManager.getStatus();
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message));
      }, ms);
    });
  }

  /**
   * Close the service
   */
  async close(): Promise<void> {
    try {
      await closePdfPoolManager();
      this.pdfCache.destroy();
      this.initialized = false;
      logger.info('Optimized PDF service closed');
    } catch (error) {
      logger.error('Error closing optimized PDF service', error);
    }
  }
}

/**
 * Create and initialize an optimized PDF service
 */
export async function createOptimizedPdfService(): Promise<OptimizedPdfService> {
  const pdfCache = new PdfCache(parseInt(process.env.PDF_CACHE_TTL || '86400'));

  let s3Storage: S3Storage | undefined;
  if (process.env.AWS_S3_BUCKET) {
    s3Storage = new S3Storage({
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
      signedUrlExpirationSeconds: parseInt(process.env.AWS_SIGNED_URL_EXPIRATION || '3600'),
    });
  }

  const service = new OptimizedPdfService(pdfCache, s3Storage);
  await service.initialize();

  return service;
}

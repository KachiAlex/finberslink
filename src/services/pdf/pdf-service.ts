import { PdfGenerator } from './pdf-generator';
import { PdfCache } from './pdf-cache';
import { S3Storage } from './s3-storage';
import { Logger } from '@/lib/logger';

export interface ExportResumePdfOptions {
  resumeId: string;
  template: 'Modern' | 'Classic' | 'Minimal';
  htmlContent: string;
  fileName: string;
  metadata?: Record<string, string>;
}

export interface ExportResumePdfResult {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  generatedAt: string;
  s3Key?: string;
}

/**
 * PdfService orchestrates PDF generation, caching, and S3 storage
 */
export class PdfService {
  private pdfGenerator: PdfGenerator;
  private pdfCache: PdfCache;
  private s3Storage: S3Storage | null;
  private logger: Logger;
  private initialized: boolean = false;

  constructor(
    pdfGenerator: PdfGenerator,
    pdfCache: PdfCache,
    s3Storage?: S3Storage
  ) {
    this.pdfGenerator = pdfGenerator;
    this.pdfCache = pdfCache;
    this.s3Storage = s3Storage || null;
    this.logger = new Logger('PdfService');
  }

  /**
   * Initialize the PDF service
   */
  async initialize(): Promise<void> {
    try {
      await this.pdfGenerator.initialize();
      this.initialized = true;
      this.logger.info('PDF service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize PDF service', error);
      throw error;
    }
  }

  /**
   * Export resume as PDF with caching and S3 storage
   */
  async exportResumePdf(options: ExportResumePdfOptions): Promise<ExportResumePdfResult> {
    if (!this.initialized) {
      throw new Error('PDF service not initialized. Call initialize() first.');
    }

    try {
      // Generate cache key
      const contentHash = PdfCache.hashContent(options.htmlContent);
      const cacheKey = PdfCache.generateKey(options.resumeId, options.template, contentHash);

      // Check cache first
      let pdfBuffer = this.pdfCache.get(cacheKey);

      if (!pdfBuffer) {
        this.logger.debug(`Cache miss for resume ${options.resumeId}, generating PDF`);

        // Generate PDF
        pdfBuffer = await this.pdfGenerator.generatePdf({
          htmlContent: options.htmlContent,
        });

        // Store in cache
        this.pdfCache.set(cacheKey, pdfBuffer);
      } else {
        this.logger.debug(`Cache hit for resume ${options.resumeId}`);
      }

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

      const result: ExportResumePdfResult = {
        downloadUrl,
        fileName: options.fileName,
        fileSize: pdfBuffer.length,
        generatedAt: new Date().toISOString(),
        s3Key,
      };

      this.logger.info(`Resume PDF exported: ${options.resumeId}, size: ${pdfBuffer.length} bytes`);
      return result;
    } catch (error) {
      this.logger.error(`Error exporting resume PDF: ${options.resumeId}`, error);
      throw error;
    }
  }

  /**
   * Invalidate cached PDF for a resume
   */
  invalidateCache(resumeId: string, template: string, contentHash: string): void {
    const cacheKey = PdfCache.generateKey(resumeId, template, contentHash);
    this.pdfCache.invalidate(cacheKey);
    this.logger.info(`Cache invalidated for resume ${resumeId}`);
  }

  /**
   * Clear all cached PDFs
   */
  clearCache(): void {
    this.pdfCache.clear();
    this.logger.info('All PDF cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxConcurrentInstances: number;
    activeInstances: number;
  } {
    return {
      size: this.pdfCache.getSize(),
      maxConcurrentInstances: this.pdfGenerator.getMaxConcurrentInstances(),
      activeInstances: this.pdfGenerator.getActiveInstancesCount(),
    };
  }

  /**
   * Close the service and clean up resources
   */
  async close(): Promise<void> {
    try {
      await this.pdfGenerator.close();
      this.pdfCache.destroy();
      this.initialized = false;
      this.logger.info('PDF service closed');
    } catch (error) {
      this.logger.error('Error closing PDF service', error);
    }
  }
}

/**
 * Create and initialize a PDF service instance
 */
export async function createPdfService(): Promise<PdfService> {
  const pdfGenerator = new PdfGenerator({
    maxConcurrentInstances: parseInt(process.env.PDF_MAX_CONCURRENT_INSTANCES || '5'),
    timeoutMs: parseInt(process.env.PDF_GENERATION_TIMEOUT || '30000'),
  });

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

  const pdfService = new PdfService(pdfGenerator, pdfCache, s3Storage);
  await pdfService.initialize();

  return pdfService;
}

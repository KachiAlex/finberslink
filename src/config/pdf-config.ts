/**
 * PDF Service Configuration
 * Centralized configuration for all PDF generation settings
 */

export interface PdfConfig {
  // PDF Generation
  maxConcurrentInstances: number;
  generationTimeoutMs: number;
  
  // Caching
  cacheTtlSeconds: number;
  
  // S3 Storage
  s3Enabled: boolean;
  s3Bucket?: string;
  s3Region?: string;
  s3CloudFrontDomain?: string;
  s3SignedUrlExpirationSeconds?: number;
  
  // Redis (optional)
  redisEnabled: boolean;
  redisUrl?: string;
  
  // Performance
  maxFileSizeBytes: number;
  
  // Logging
  enableDetailedLogging: boolean;
}

/**
 * Load PDF configuration from environment variables
 */
export function loadPdfConfig(): PdfConfig {
  return {
    // PDF Generation
    maxConcurrentInstances: parseInt(process.env.PDF_MAX_CONCURRENT_INSTANCES || '5'),
    generationTimeoutMs: parseInt(process.env.PDF_GENERATION_TIMEOUT || '30000'),
    
    // Caching
    cacheTtlSeconds: parseInt(process.env.PDF_CACHE_TTL || '86400'),
    
    // S3 Storage
    s3Enabled: !!process.env.AWS_S3_BUCKET,
    s3Bucket: process.env.AWS_S3_BUCKET,
    s3Region: process.env.AWS_REGION || 'us-east-1',
    s3CloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
    s3SignedUrlExpirationSeconds: parseInt(process.env.AWS_SIGNED_URL_EXPIRATION || '3600'),
    
    // Redis
    redisEnabled: !!process.env.REDIS_URL,
    redisUrl: process.env.REDIS_URL,
    
    // Performance
    maxFileSizeBytes: parseInt(process.env.PDF_MAX_FILE_SIZE || '10485760'), // 10MB default
    
    // Logging
    enableDetailedLogging: process.env.NODE_ENV !== 'production',
  };
}

/**
 * Validate PDF configuration
 */
export function validatePdfConfig(config: PdfConfig): string[] {
  const errors: string[] = [];

  if (config.maxConcurrentInstances < 1) {
    errors.push('maxConcurrentInstances must be at least 1');
  }

  if (config.generationTimeoutMs < 1000) {
    errors.push('generationTimeoutMs must be at least 1000ms');
  }

  if (config.cacheTtlSeconds < 0) {
    errors.push('cacheTtlSeconds must be non-negative');
  }

  if (config.s3Enabled && !config.s3Bucket) {
    errors.push('s3Bucket is required when S3 is enabled');
  }

  if (config.redisEnabled && !config.redisUrl) {
    errors.push('redisUrl is required when Redis is enabled');
  }

  if (config.maxFileSizeBytes < 1024) {
    errors.push('maxFileSizeBytes must be at least 1024 bytes');
  }

  return errors;
}

/**
 * Get default PDF configuration
 */
export function getDefaultPdfConfig(): PdfConfig {
  return {
    maxConcurrentInstances: 5,
    generationTimeoutMs: 30000,
    cacheTtlSeconds: 86400,
    s3Enabled: false,
    redisEnabled: false,
    maxFileSizeBytes: 10485760,
    enableDetailedLogging: true,
  };
}

/**
 * Merge configurations with defaults
 */
export function mergePdfConfig(partial: Partial<PdfConfig>): PdfConfig {
  return {
    ...getDefaultPdfConfig(),
    ...partial,
  };
}

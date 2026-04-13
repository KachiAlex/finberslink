import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger } from '@/lib/logger';

interface S3StorageConfig {
  bucket: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  cloudFrontDomain?: string;
  signedUrlExpirationSeconds?: number;
}

/**
 * S3Storage handles PDF upload, retrieval, and deletion from AWS S3
 * with CloudFront CDN integration for delivery.
 */
export class S3Storage {
  private s3Client: S3Client;
  private bucket: string;
  private cloudFrontDomain: string | null;
  private signedUrlExpirationSeconds: number;
  private logger: Logger;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.cloudFrontDomain = config.cloudFrontDomain || null;
    this.signedUrlExpirationSeconds = config.signedUrlExpirationSeconds || 3600;
    this.logger = new Logger('S3Storage');

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Upload PDF to S3
   */
  async uploadPdf(buffer: Buffer, fileName: string, metadata?: Record<string, string>): Promise<string> {
    try {
      const key = this.generateS3Key(fileName);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
        Metadata: metadata || {},
        CacheControl: 'max-age=31536000', // 1 year cache
      });

      await this.s3Client.send(command);
      this.logger.info(`PDF uploaded to S3: ${key}`);

      return key;
    } catch (error) {
      this.logger.error('Error uploading PDF to S3', error);
      throw new Error('Failed to upload PDF to S3');
    }
  }

  /**
   * Get signed URL for PDF download
   */
  async getPdfUrl(key: string): Promise<string> {
    try {
      // If CloudFront domain is configured, use it for faster delivery
      if (this.cloudFrontDomain) {
        return `${this.cloudFrontDomain}/${key}`;
      }

      // Otherwise, generate a signed S3 URL
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.signedUrlExpirationSeconds,
      });

      this.logger.debug(`Generated signed URL for: ${key}`);
      return url;
    } catch (error) {
      this.logger.error('Error generating PDF URL', error);
      throw new Error('Failed to generate PDF URL');
    }
  }

  /**
   * Delete PDF from S3
   */
  async deletePdf(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.info(`PDF deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting PDF from S3', error);
      throw new Error('Failed to delete PDF from S3');
    }
  }

  /**
   * Generate S3 key for PDF storage
   */
  private generateS3Key(fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `resumes/${timestamp}/${sanitizedFileName}`;
  }

  /**
   * Check if PDF exists in S3
   */
  async pdfExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      this.logger.error('Error checking PDF existence', error);
      throw error;
    }
  }

  /**
   * Get S3 client for advanced operations
   */
  getClient(): S3Client {
    return this.s3Client;
  }
}

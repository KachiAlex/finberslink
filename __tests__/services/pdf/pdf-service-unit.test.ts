/**
 * Comprehensive Unit Tests for PDF Service
 * 
 * Tests all PDF service functionality including:
 * - Template selection and validation
 * - Filename generation and formatting
 * - Error handling for various failure scenarios
 * - Cache management
 * - S3 storage integration
 * - Resource cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PdfService } from '@/services/pdf/pdf-service';
import { PdfGenerator } from '@/services/pdf/pdf-generator';
import { PdfCache } from '@/services/pdf/pdf-cache';
import { S3Storage } from '@/services/pdf/s3-storage';

// Mock dependencies
vi.mock('@/services/pdf/pdf-generator');
vi.mock('@/services/pdf/pdf-cache');
vi.mock('@/services/pdf/s3-storage');

describe('PdfService - Unit Tests', () => {
  let pdfService: PdfService;
  let mockPdfGenerator: any;
  let mockPdfCache: any;
  let mockS3Storage: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    mockPdfGenerator = {
      initialize: vi.fn().mockResolvedValue(undefined),
      generatePdf: vi.fn().mockResolvedValue(Buffer.from('pdf content')),
      close: vi.fn().mockResolvedValue(undefined),
      getMaxConcurrentInstances: vi.fn().returnValue(5),
      getActiveInstancesCount: vi.fn().returnValue(0),
    };

    mockPdfCache = {
      get: vi.fn().mockReturnValue(null),
      set: vi.fn(),
      invalidate: vi.fn(),
      clear: vi.fn(),
      getSize: vi.fn().returnValue(0),
      destroy: vi.fn(),
    };

    mockS3Storage = {
      uploadPdf: vi.fn().mockResolvedValue('resumes/123/test.pdf'),
      getPdfUrl: vi.fn().mockResolvedValue('https://example.com/pdf'),
      deletePdf: vi.fn().mockResolvedValue(undefined),
    };

    // Create service with mocks
    pdfService = new PdfService(mockPdfGenerator, mockPdfCache, mockS3Storage);
  });

  afterEach(async () => {
    if (pdfService) {
      await pdfService.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize PDF service successfully', async () => {
      await pdfService.initialize();
      expect(mockPdfGenerator.initialize).toHaveBeenCalled();
    });

    it('should throw error if not initialized before export', async () => {
      const options = {
        resumeId: 'resume-123',
        template: 'Modern' as const,
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      };

      await expect(pdfService.exportResumePdf(options)).rejects.toThrow(
        'PDF service not initialized'
      );
    });

    it('should handle initialization failure gracefully', async () => {
      mockPdfGenerator.initialize.mockRejectedValueOnce(new Error('Browser launch failed'));

      await expect(pdfService.initialize()).rejects.toThrow('Browser launch failed');
    });
  });

  describe('PDF Export - Template Selection', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should export resume with Modern template', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html><body>Resume</body></html>',
        fileName: 'John_Doe_Resume.pdf',
      });

      expect(result.fileName).toBe('John_Doe_Resume.pdf');
      expect(result.downloadUrl).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
    });

    it('should export resume with Classic template', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-456',
        template: 'Classic',
        htmlContent: '<html><body>Resume</body></html>',
        fileName: 'Jane_Smith_Resume.pdf',
      });

      expect(result.fileName).toBe('Jane_Smith_Resume.pdf');
      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
    });

    it('should export resume with Minimal template', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-789',
        template: 'Minimal',
        htmlContent: '<html><body>Resume</body></html>',
        fileName: 'Bob_Johnson_Resume.pdf',
      });

      expect(result.fileName).toBe('Bob_Johnson_Resume.pdf');
      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
    });
  });

  describe('Filename Generation', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should preserve filename format', async () => {
      const fileName = 'John_Doe_Resume.pdf';
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName,
      });

      expect(result.fileName).toBe(fileName);
    });

    it('should handle special characters in filename', async () => {
      const fileName = 'Jean-Pierre_O\'Brien_Resume.pdf';
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName,
      });

      expect(result.fileName).toBe(fileName);
    });

    it('should handle unicode characters in filename', async () => {
      const fileName = 'José_García_Resume.pdf';
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName,
      });

      expect(result.fileName).toBe(fileName);
    });
  });

  describe('Caching Behavior', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should use cached PDF on cache hit', async () => {
      const cachedBuffer = Buffer.from('cached pdf');
      mockPdfCache.get.mockReturnValueOnce(cachedBuffer);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockPdfCache.get).toHaveBeenCalled();
      expect(mockPdfGenerator.generatePdf).not.toHaveBeenCalled();
      expect(result.fileSize).toBe(cachedBuffer.length);
    });

    it('should generate and cache PDF on cache miss', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);
      const pdfBuffer = Buffer.from('generated pdf');
      mockPdfGenerator.generatePdf.mockResolvedValueOnce(pdfBuffer);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
      expect(mockPdfCache.set).toHaveBeenCalled();
      expect(result.fileSize).toBe(pdfBuffer.length);
    });

    it('should invalidate cache for specific resume', () => {
      pdfService.invalidateCache('resume-123', 'Modern', 'hash123');

      expect(mockPdfCache.invalidate).toHaveBeenCalled();
    });

    it('should clear all cache', () => {
      pdfService.clearCache();

      expect(mockPdfCache.clear).toHaveBeenCalled();
    });
  });

  describe('S3 Storage Integration', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should upload PDF to S3 and return URL', async () => {
      const s3Url = 'https://cdn.example.com/resumes/123/test.pdf';
      mockS3Storage.getPdfUrl.mockResolvedValueOnce(s3Url);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
        metadata: { userId: 'user-123' },
      });

      expect(mockS3Storage.uploadPdf).toHaveBeenCalled();
      expect(mockS3Storage.getPdfUrl).toHaveBeenCalled();
      expect(result.downloadUrl).toBe(s3Url);
      expect(result.s3Key).toBeDefined();
    });

    it('should include metadata when uploading to S3', async () => {
      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
        metadata: { userId: 'user-123', version: '1' },
      });

      expect(mockS3Storage.uploadPdf).toHaveBeenCalledWith(
        expect.any(Buffer),
        'test.pdf',
        expect.objectContaining({
          resumeId: 'resume-123',
          template: 'Modern',
          userId: 'user-123',
          version: '1',
        })
      );
    });

    it('should fallback to base64 URL if S3 not configured', async () => {
      const serviceWithoutS3 = new PdfService(mockPdfGenerator, mockPdfCache);
      await serviceWithoutS3.initialize();

      const result = await serviceWithoutS3.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result.downloadUrl).toMatch(/^data:application\/pdf;base64,/);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should handle PDF generation timeout', async () => {
      mockPdfGenerator.generatePdf.mockRejectedValueOnce(new Error('Timeout'));

      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent: '<html></html>',
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('Timeout');
    });

    it('should handle S3 upload failure', async () => {
      mockS3Storage.uploadPdf.mockRejectedValueOnce(new Error('S3 upload failed'));

      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent: '<html></html>',
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('S3 upload failed');
    });

    it('should handle invalid HTML content', async () => {
      mockPdfGenerator.generatePdf.mockRejectedValueOnce(new Error('Invalid HTML'));

      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent: 'not valid html',
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('Invalid HTML');
    });
  });

  describe('Cache Statistics', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should return cache statistics', () => {
      mockPdfCache.getSize.mockReturnValueOnce(1024);
      mockPdfGenerator.getMaxConcurrentInstances.mockReturnValueOnce(5);
      mockPdfGenerator.getActiveInstancesCount.mockReturnValueOnce(2);

      const stats = pdfService.getCacheStats();

      expect(stats.size).toBe(1024);
      expect(stats.maxConcurrentInstances).toBe(5);
      expect(stats.activeInstances).toBe(2);
    });
  });

  describe('Resource Cleanup', () => {
    it('should close service and cleanup resources', async () => {
      await pdfService.initialize();
      await pdfService.close();

      expect(mockPdfGenerator.close).toHaveBeenCalled();
      expect(mockPdfCache.destroy).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      await pdfService.initialize();
      mockPdfGenerator.close.mockRejectedValueOnce(new Error('Close failed'));

      // Should not throw
      await expect(pdfService.close()).resolves.not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should handle multiple concurrent exports', async () => {
      const exports = Array.from({ length: 3 }, (_, i) =>
        pdfService.exportResumePdf({
          resumeId: `resume-${i}`,
          template: 'Modern',
          htmlContent: '<html></html>',
          fileName: `resume-${i}.pdf`,
        })
      );

      const results = await Promise.all(exports);

      expect(results).toHaveLength(3);
      expect(mockPdfGenerator.generatePdf).toHaveBeenCalledTimes(3);
    });
  });

  describe('Content Hash and Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const content = '<html><body>Test</body></html>';
      const hash1 = PdfCache.hashContent(content);
      const hash2 = PdfCache.hashContent(content);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const content1 = '<html><body>Test 1</body></html>';
      const content2 = '<html><body>Test 2</body></html>';

      const hash1 = PdfCache.hashContent(content1);
      const hash2 = PdfCache.hashContent(content2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate unique cache keys for different resumes', () => {
      const key1 = PdfCache.generateKey('resume-1', 'Modern', 'hash123');
      const key2 = PdfCache.generateKey('resume-2', 'Modern', 'hash123');

      expect(key1).not.toBe(key2);
    });

    it('should generate unique cache keys for different templates', () => {
      const key1 = PdfCache.generateKey('resume-1', 'Modern', 'hash123');
      const key2 = PdfCache.generateKey('resume-1', 'Classic', 'hash123');

      expect(key1).not.toBe(key2);
    });
  });

  describe('Output Correctness', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should return correct file size', async () => {
      const pdfBuffer = Buffer.from('test pdf content');
      mockPdfGenerator.generatePdf.mockResolvedValueOnce(pdfBuffer);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result.fileSize).toBe(pdfBuffer.length);
    });

    it('should return valid ISO timestamp', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result.generatedAt).toBeDefined();
      expect(new Date(result.generatedAt).getTime()).toBeGreaterThan(0);
    });

    it('should include all required fields in result', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result).toHaveProperty('downloadUrl');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('generatedAt');
    });
  });
});

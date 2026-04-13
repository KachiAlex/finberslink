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

describe('PdfService - Comprehensive Unit Tests', () => {
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
        htmlContent: '<html><body>Test</body></html>',
        fileName: 'John_Doe_Resume.pdf',
      });

      expect(result.fileName).toBe('John_Doe_Resume.pdf');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
    });

    it('should export resume with Classic template', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-456',
        template: 'Classic',
        htmlContent: '<html><body>Classic</body></html>',
        fileName: 'Jane_Smith_Resume.pdf',
      });

      expect(result.fileName).toBe('Jane_Smith_Resume.pdf');
      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
    });

    it('should export resume with Minimal template', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-789',
        template: 'Minimal',
        htmlContent: '<html><body>Minimal</body></html>',
        fileName: 'Bob_Johnson_Resume.pdf',
      });

      expect(result.fileName).toBe('Bob_Johnson_Resume.pdf');
      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
    });
  });

  describe('PDF Export - Filename Generation', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should preserve filename format', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'FirstName_LastName_Resume.pdf',
      });

      expect(result.fileName).toBe('FirstName_LastName_Resume.pdf');
    });

    it('should handle special characters in filename', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'Jean-Pierre_Dupont_Resume.pdf',
      });

      expect(result.fileName).toBe('Jean-Pierre_Dupont_Resume.pdf');
    });

    it('should include PDF extension in filename', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'Resume.pdf',
      });

      expect(result.fileName).toEndWith('.pdf');
    });
  });

  describe('PDF Export - Caching', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should use cached PDF if available', async () => {
      const pdfBuffer = Buffer.from('cached pdf content');
      mockPdfCache.get.mockReturnValueOnce(pdfBuffer);

      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockPdfCache.get).toHaveBeenCalled();
      expect(mockPdfGenerator.generatePdf).not.toHaveBeenCalled();
    });

    it('should generate PDF if not cached', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);

      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
      expect(mockPdfCache.set).toHaveBeenCalled();
    });

    it('should cache generated PDF', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);

      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockPdfCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer)
      );
    });

    it('should invalidate cache for specific resume', () => {
      pdfService.invalidateCache('resume-123', 'Modern', 'hash-abc');
      expect(mockPdfCache.invalidate).toHaveBeenCalled();
    });

    it('should clear all cache', () => {
      pdfService.clearCache();
      expect(mockPdfCache.clear).toHaveBeenCalled();
    });
  });

  describe('PDF Export - S3 Storage', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should upload PDF to S3 if configured', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockS3Storage.uploadPdf).toHaveBeenCalled();
      expect(result.s3Key).toBe('resumes/123/test.pdf');
    });

    it('should include metadata in S3 upload', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);

      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
        metadata: { custom: 'value' },
      });

      expect(mockS3Storage.uploadPdf).toHaveBeenCalledWith(
        expect.any(Buffer),
        'test.pdf',
        expect.objectContaining({
          resumeId: 'resume-123',
          template: 'Modern',
          custom: 'value',
        })
      );
    });

    it('should get download URL from S3', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);
      mockS3Storage.getPdfUrl.mockResolvedValueOnce('https://cdn.example.com/pdf');

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result.downloadUrl).toBe('https://cdn.example.com/pdf');
    });

    it('should handle S3 upload failure', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);
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
  });

  describe('PDF Export - Error Handling', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should handle PDF generation timeout', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);
      mockPdfGenerator.generatePdf.mockRejectedValueOnce(
        new Error('PDF generation timeout')
      );

      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent: '<html></html>',
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('PDF generation timeout');
    });

    it('should handle invalid HTML content', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);
      mockPdfGenerator.generatePdf.mockRejectedValueOnce(
        new Error('Invalid HTML content')
      );

      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent: 'invalid html',
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('Invalid HTML content');
    });

    it('should handle empty HTML content', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);
      mockPdfGenerator.generatePdf.mockRejectedValueOnce(
        new Error('HTML content is empty')
      );

      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent: '',
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('HTML content is empty');
    });
  });

  describe('Cache Statistics', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should return cache statistics', () => {
      mockPdfCache.getSize.mockReturnValueOnce(5);
      mockPdfGenerator.getMaxConcurrentInstances.mockReturnValueOnce(5);
      mockPdfGenerator.getActiveInstancesCount.mockReturnValueOnce(2);

      const stats = pdfService.getCacheStats();

      expect(stats.size).toBe(5);
      expect(stats.maxConcurrentInstances).toBe(5);
      expect(stats.activeInstances).toBe(2);
    });

    it('should track cache size changes', () => {
      mockPdfCache.getSize.mockReturnValueOnce(0);
      let stats = pdfService.getCacheStats();
      expect(stats.size).toBe(0);

      mockPdfCache.getSize.mockReturnValueOnce(10);
      stats = pdfService.getCacheStats();
      expect(stats.size).toBe(10);
    });
  });

  describe('Resource Cleanup', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should close service and clean up resources', async () => {
      await pdfService.close();

      expect(mockPdfGenerator.close).toHaveBeenCalled();
      expect(mockPdfCache.destroy).toHaveBeenCalled();
    });

    it('should handle close gracefully if not initialized', async () => {
      const uninitializedService = new PdfService(
        mockPdfGenerator,
        mockPdfCache,
        mockS3Storage
      );

      await expect(uninitializedService.close()).resolves.not.toThrow();
    });

    it('should handle close errors gracefully', async () => {
      mockPdfGenerator.close.mockRejectedValueOnce(new Error('Close failed'));

      await expect(pdfService.close()).resolves.not.toThrow();
    });
  });

  describe('PDF Export Result', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should return correct file size', async () => {
      const pdfBuffer = Buffer.from('test pdf content with some data');
      mockPdfCache.get.mockReturnValueOnce(null);
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
      mockPdfCache.get.mockReturnValueOnce(null);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result.generatedAt).toBeDefined();
      expect(new Date(result.generatedAt)).toBeInstanceOf(Date);
    });

    it('should return download URL', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result.downloadUrl).toBeDefined();
      expect(result.downloadUrl.length).toBeGreaterThan(0);
    });
  });

  describe('Service without S3 Storage', () => {
    beforeEach(async () => {
      pdfService = new PdfService(mockPdfGenerator, mockPdfCache);
      await pdfService.initialize();
    });

    it('should generate base64 download URL when S3 not configured', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(result.downloadUrl).toContain('data:application/pdf;base64,');
    });

    it('should not call S3 upload when not configured', async () => {
      mockPdfCache.get.mockReturnValueOnce(null);

      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockS3Storage.uploadPdf).not.toHaveBeenCalled();
    });
  });
});

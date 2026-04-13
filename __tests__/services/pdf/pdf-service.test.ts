import { PdfService } from '@/services/pdf/pdf-service';
import { PdfGenerator } from '@/services/pdf/pdf-generator';
import { PdfCache } from '@/services/pdf/pdf-cache';
import { S3Storage } from '@/services/pdf/s3-storage';

jest.mock('@/services/pdf/pdf-generator');
jest.mock('@/services/pdf/pdf-cache');
jest.mock('@/services/pdf/s3-storage');

describe('PdfService', () => {
  let pdfService: PdfService;
  let mockPdfGenerator: jest.Mocked<PdfGenerator>;
  let mockPdfCache: jest.Mocked<PdfCache>;
  let mockS3Storage: jest.Mocked<S3Storage>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPdfGenerator = new PdfGenerator() as jest.Mocked<PdfGenerator>;
    mockPdfCache = new PdfCache() as jest.Mocked<PdfCache>;
    mockS3Storage = new S3Storage({ bucket: 'test' }) as jest.Mocked<S3Storage>;

    mockPdfGenerator.initialize = jest.fn().mockResolvedValue(undefined);
    mockPdfGenerator.generatePdf = jest.fn().mockResolvedValue(Buffer.from('pdf content'));
    mockPdfGenerator.close = jest.fn().mockResolvedValue(undefined);
    mockPdfGenerator.getMaxConcurrentInstances = jest.fn().returnValue(5);
    mockPdfGenerator.getActiveInstancesCount = jest.fn().returnValue(0);

    mockPdfCache.get = jest.fn().mockReturnValue(null);
    mockPdfCache.set = jest.fn();
    mockPdfCache.invalidate = jest.fn();
    mockPdfCache.clear = jest.fn();
    mockPdfCache.getSize = jest.fn().returnValue(0);
    mockPdfCache.destroy = jest.fn();

    mockS3Storage.uploadPdf = jest.fn().mockResolvedValue('resumes/123/test.pdf');
    mockS3Storage.getPdfUrl = jest.fn().mockResolvedValue('https://example.com/pdf');
    mockS3Storage.deletePdf = jest.fn().mockResolvedValue(undefined);

    pdfService = new PdfService(mockPdfGenerator, mockPdfCache, mockS3Storage);
  });

  describe('initialization', () => {
    it('should initialize PDF service', async () => {
      await pdfService.initialize();
      expect(mockPdfGenerator.initialize).toHaveBeenCalled();
    });

    it('should throw error if not initialized before export', async () => {
      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent: '<html></html>',
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('PDF service not initialized');
    });
  });

  describe('PDF export', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should export resume as PDF', async () => {
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html><body>Test</body></html>',
        fileName: 'John_Doe_Resume.pdf',
      });

      expect(result.fileName).toBe('John_Doe_Resume.pdf');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.downloadUrl).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    it('should use cached PDF if available', async () => {
      const pdfBuffer = Buffer.from('cached pdf');
      mockPdfCache.get = jest.fn().mockReturnValue(pdfBuffer);

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
      mockPdfCache.get = jest.fn().mockReturnValue(null);

      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: '<html></html>',
        fileName: 'test.pdf',
      });

      expect(mockPdfGenerator.generatePdf).toHaveBeenCalled();
      expect(mockPdfCache.set).toHaveBeenCalled();
    });

    it('should upload PDF to S3 if configured', async () => {
      mockPdfCache.get = jest.fn().mockReturnValue(null);

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
      mockPdfCache.get = jest.fn().mockReturnValue(null);

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
  });

  describe('cache management', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should invalidate cache for resume', () => {
      pdfService.invalidateCache('resume-123', 'Modern', 'hash-abc');
      expect(mockPdfCache.invalidate).toHaveBeenCalled();
    });

    it('should clear all cache', () => {
      pdfService.clearCache();
      expect(mockPdfCache.clear).toHaveBeenCalled();
    });

    it('should get cache statistics', () => {
      mockPdfCache.getSize = jest.fn().returnValue(5);

      const stats = pdfService.getCacheStats();

      expect(stats.size).toBe(5);
      expect(stats.maxConcurrentInstances).toBe(5);
      expect(stats.activeInstances).toBe(0);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await pdfService.initialize();
    });

    it('should close service and clean up resources', async () => {
      await pdfService.close();

      expect(mockPdfGenerator.close).toHaveBeenCalled();
      expect(mockPdfCache.destroy).toHaveBeenCalled();
    });
  });
});

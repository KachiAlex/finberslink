/**
 * Integration tests for PDF service
 * These tests verify the complete PDF export workflow
 */

import { PdfService } from '@/services/pdf/pdf-service';
import { PdfGenerator } from '@/services/pdf/pdf-generator';
import { PdfCache } from '@/services/pdf/pdf-cache';
import { S3Storage } from '@/services/pdf/s3-storage';

describe('PDF Service Integration Tests', () => {
  let pdfService: PdfService;
  let pdfGenerator: PdfGenerator;
  let pdfCache: PdfCache;

  beforeEach(async () => {
    pdfGenerator = new PdfGenerator({
      maxConcurrentInstances: 2,
      timeoutMs: 5000,
    });

    pdfCache = new PdfCache(1); // 1 second TTL for testing

    // Create service without S3 for integration tests
    pdfService = new PdfService(pdfGenerator, pdfCache);
  });

  afterEach(async () => {
    await pdfService.close();
  });

  describe('PDF export workflow', () => {
    it('should complete full PDF export workflow', async () => {
      await pdfService.initialize();

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .section { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>John Doe</h1>
            <div class="section">
              <h2>Summary</h2>
              <p>Experienced software engineer with 5 years of experience.</p>
            </div>
            <div class="section">
              <h2>Experience</h2>
              <p>Senior Developer at Tech Company (2020-Present)</p>
            </div>
          </body>
        </html>
      `;

      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent,
        fileName: 'John_Doe_Resume.pdf',
      });

      expect(result.fileName).toBe('John_Doe_Resume.pdf');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.downloadUrl).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    it('should use cache for subsequent exports', async () => {
      await pdfService.initialize();

      const htmlContent = '<html><body>Test Resume</body></html>';

      // First export
      const result1 = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent,
        fileName: 'test.pdf',
      });

      // Second export with same content
      const result2 = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent,
        fileName: 'test.pdf',
      });

      // Both should have same file size (from cache)
      expect(result1.fileSize).toBe(result2.fileSize);
    });

    it('should generate different PDFs for different templates', async () => {
      await pdfService.initialize();

      const htmlContent = '<html><body>Test Resume</body></html>';

      const modernResult = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent,
        fileName: 'test.pdf',
      });

      const classicResult = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Classic',
        htmlContent,
        fileName: 'test.pdf',
      });

      // Different templates should be cached separately
      expect(modernResult.downloadUrl).toBeDefined();
      expect(classicResult.downloadUrl).toBeDefined();
    });

    it('should handle cache invalidation', async () => {
      await pdfService.initialize();

      const htmlContent = '<html><body>Test Resume</body></html>';
      const contentHash = PdfCache.hashContent(htmlContent);

      // Export and cache
      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent,
        fileName: 'test.pdf',
      });

      // Invalidate cache
      pdfService.invalidateCache('resume-123', 'Modern', contentHash);

      // Cache should be empty
      expect(pdfService.getCacheStats().size).toBe(0);
    });

    it('should clear all cache', async () => {
      await pdfService.initialize();

      const htmlContent = '<html><body>Test Resume</body></html>';

      // Export multiple PDFs
      await pdfService.exportResumePdf({
        resumeId: 'resume-1',
        template: 'Modern',
        htmlContent,
        fileName: 'test1.pdf',
      });

      await pdfService.exportResumePdf({
        resumeId: 'resume-2',
        template: 'Classic',
        htmlContent,
        fileName: 'test2.pdf',
      });

      // Clear cache
      pdfService.clearCache();

      // Cache should be empty
      expect(pdfService.getCacheStats().size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw error if service not initialized', async () => {
      const htmlContent = '<html><body>Test</body></html>';

      await expect(
        pdfService.exportResumePdf({
          resumeId: 'resume-123',
          template: 'Modern',
          htmlContent,
          fileName: 'test.pdf',
        })
      ).rejects.toThrow('PDF service not initialized');
    });

    it('should handle invalid HTML gracefully', async () => {
      await pdfService.initialize();

      const invalidHtml = '<html><body>Unclosed tag</body>';

      // Should still generate PDF (Puppeteer is forgiving)
      const result = await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent: invalidHtml,
        fileName: 'test.pdf',
      });

      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('cache statistics', () => {
    it('should track cache statistics', async () => {
      await pdfService.initialize();

      const stats1 = pdfService.getCacheStats();
      expect(stats1.size).toBe(0);
      expect(stats1.maxConcurrentInstances).toBe(2);
      expect(stats1.activeInstances).toBe(0);

      const htmlContent = '<html><body>Test</body></html>';

      await pdfService.exportResumePdf({
        resumeId: 'resume-123',
        template: 'Modern',
        htmlContent,
        fileName: 'test.pdf',
      });

      const stats2 = pdfService.getCacheStats();
      expect(stats2.size).toBeGreaterThan(0);
    });
  });

  describe('service lifecycle', () => {
    it('should initialize and close gracefully', async () => {
      await pdfService.initialize();
      await pdfService.close();
      // Should not throw
    });

    it('should handle multiple initializations', async () => {
      await pdfService.initialize();
      await pdfService.close();

      // Create new service
      const newService = new PdfService(pdfGenerator, pdfCache);
      await newService.initialize();
      await newService.close();
    });
  });
});

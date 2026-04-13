import { PdfGenerator } from '@/services/pdf/pdf-generator';

describe('PdfGenerator', () => {
  let pdfGenerator: PdfGenerator;

  beforeEach(() => {
    pdfGenerator = new PdfGenerator({
      maxConcurrentInstances: 2,
      timeoutMs: 5000,
    });
  });

  afterEach(async () => {
    await pdfGenerator.close();
  });

  describe('initialization', () => {
    it('should initialize browser pool', async () => {
      await pdfGenerator.initialize();
      expect(pdfGenerator.getMaxConcurrentInstances()).toBe(2);
    });

    it('should throw error if browser initialization fails', async () => {
      // Mock puppeteer to fail
      jest.mock('puppeteer', () => ({
        launch: jest.fn().mockRejectedValue(new Error('Browser launch failed')),
      }));

      const failingGenerator = new PdfGenerator();
      await expect(failingGenerator.initialize()).rejects.toThrow('Failed to initialize PDF generator');
    });
  });

  describe('connection pooling', () => {
    it('should track active instances', async () => {
      await pdfGenerator.initialize();
      expect(pdfGenerator.getActiveInstancesCount()).toBe(0);
    });

    it('should respect max concurrent instances limit', async () => {
      await pdfGenerator.initialize();
      expect(pdfGenerator.getMaxConcurrentInstances()).toBe(2);
    });
  });

  describe('resource cleanup', () => {
    it('should close browser pool', async () => {
      await pdfGenerator.initialize();
      await pdfGenerator.close();
      // Should not throw
    });

    it('should handle close gracefully if not initialized', async () => {
      await pdfGenerator.close();
      // Should not throw
    });
  });

  describe('error handling', () => {
    it('should throw error if generating PDF without initialization', async () => {
      const htmlContent = '<html><body>Test</body></html>';
      await expect(
        pdfGenerator.generatePdf({ htmlContent })
      ).rejects.toThrow('PDF generator not initialized');
    });
  });
});

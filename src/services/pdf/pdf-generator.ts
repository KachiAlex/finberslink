import { Logger } from '@/lib/logger';

interface PdfGeneratorOptions {
  maxConcurrentInstances?: number;
  timeoutMs?: number;
}

interface GeneratePdfOptions {
  htmlContent: string;
  width?: number;
  height?: number;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

/**
 * PdfGenerator manages Puppeteer browser instances with connection pooling
 * and timeout handling for PDF generation.
 */
export class PdfGenerator {
  private maxConcurrentInstances: number;
  private timeoutMs: number;
  private activeInstances: number = 0;
  private queue: Array<() => Promise<void>> = [];
  private logger: Logger;
  private browser: any = null;

  constructor(options: PdfGeneratorOptions = {}) {
    this.maxConcurrentInstances = options.maxConcurrentInstances || 5;
    this.timeoutMs = options.timeoutMs || 30000;
    this.logger = new Logger('PdfGenerator');
  }

  /**
   * Initialize the browser pool
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
        ],
      });
      this.logger.info('Browser pool initialized');
    } catch (error) {
      this.logger.error('Failed to initialize browser pool', error);
      throw new Error('Failed to initialize PDF generator');
    }
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePdf(options: GeneratePdfOptions): Promise<Buffer> {
    if (!this.browser) {
      throw new Error('PDF generator not initialized. Call initialize() first.');
    }

    return this.executeWithPooling(async () => {
      const page = await this.browser.newPage();
      try {
        // Set viewport for consistent rendering
        await page.setViewport({
          width: options.width || 1200,
          height: options.height || 1600,
        });

        // Set content with timeout
        await Promise.race([
          page.setContent(options.htmlContent, { waitUntil: 'networkidle0' }),
          this.createTimeout(this.timeoutMs, 'Content loading timeout'),
        ]);

        // Generate PDF with timeout
        const pdfBuffer = await Promise.race([
          page.pdf({
            format: options.format || 'A4',
            margin: options.margin || {
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            },
            printBackground: true,
          }),
          this.createTimeout(this.timeoutMs, 'PDF generation timeout'),
        ]);

        this.logger.debug('PDF generated successfully');
        return pdfBuffer as Buffer;
      } catch (error) {
        this.logger.error('Error generating PDF', error);
        throw error;
      } finally {
        await page.close();
      }
    });
  }

  /**
   * Execute a function with connection pooling
   */
  private async executeWithPooling<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if at max capacity
    while (this.activeInstances >= this.maxConcurrentInstances) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.activeInstances++;
    try {
      return await fn();
    } finally {
      this.activeInstances--;
    }
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
   * Close the browser and clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.logger.info('Browser pool closed');
      } catch (error) {
        this.logger.error('Error closing browser pool', error);
      }
    }
  }

  /**
   * Get current active instances count
   */
  getActiveInstancesCount(): number {
    return this.activeInstances;
  }

  /**
   * Get max concurrent instances
   */
  getMaxConcurrentInstances(): number {
    return this.maxConcurrentInstances;
  }
}

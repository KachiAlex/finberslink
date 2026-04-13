import { PdfCache } from '@/services/pdf/pdf-cache';

describe('PdfCache', () => {
  let cache: PdfCache;

  beforeEach(() => {
    cache = new PdfCache(1); // 1 second TTL for testing
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('cache operations', () => {
    it('should store and retrieve PDF from cache', () => {
      const key = 'test-key';
      const pdfBuffer = Buffer.from('test pdf content');

      cache.set(key, pdfBuffer);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(pdfBuffer);
    });

    it('should return null for non-existent key', () => {
      const retrieved = cache.get('non-existent-key');
      expect(retrieved).toBeNull();
    });

    it('should invalidate specific cache entry', () => {
      const key = 'test-key';
      const pdfBuffer = Buffer.from('test pdf content');

      cache.set(key, pdfBuffer);
      cache.invalidate(key);

      const retrieved = cache.get(key);
      expect(retrieved).toBeNull();
    });

    it('should clear all cache entries', () => {
      cache.set('key1', Buffer.from('content1'));
      cache.set('key2', Buffer.from('content2'));

      expect(cache.getSize()).toBe(2);

      cache.clear();
      expect(cache.getSize()).toBe(0);
    });
  });

  describe('TTL handling', () => {
    it('should expire entries after TTL', async () => {
      const key = 'test-key';
      const pdfBuffer = Buffer.from('test pdf content');

      cache.set(key, pdfBuffer, 1); // 1 second TTL

      // Should be available immediately
      expect(cache.get(key)).toEqual(pdfBuffer);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be expired
      expect(cache.get(key)).toBeNull();
    });

    it('should use custom TTL when provided', () => {
      const key = 'test-key';
      const pdfBuffer = Buffer.from('test pdf content');

      cache.set(key, pdfBuffer, 10); // 10 second TTL
      expect(cache.get(key)).toEqual(pdfBuffer);
    });
  });

  describe('key generation', () => {
    it('should generate consistent cache keys', () => {
      const resumeId = 'resume-123';
      const template = 'Modern';
      const contentHash = 'hash-abc';

      const key1 = PdfCache.generateKey(resumeId, template, contentHash);
      const key2 = PdfCache.generateKey(resumeId, template, contentHash);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const key1 = PdfCache.generateKey('resume-1', 'Modern', 'hash-1');
      const key2 = PdfCache.generateKey('resume-2', 'Modern', 'hash-1');
      const key3 = PdfCache.generateKey('resume-1', 'Classic', 'hash-1');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should hash content consistently', () => {
      const content = 'test content';
      const hash1 = PdfCache.hashContent(content);
      const hash2 = PdfCache.hashContent(content);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = PdfCache.hashContent('content1');
      const hash2 = PdfCache.hashContent('content2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('cache statistics', () => {
    it('should track cache size', () => {
      expect(cache.getSize()).toBe(0);

      cache.set('key1', Buffer.from('content1'));
      expect(cache.getSize()).toBe(1);

      cache.set('key2', Buffer.from('content2'));
      expect(cache.getSize()).toBe(2);

      cache.invalidate('key1');
      expect(cache.getSize()).toBe(1);
    });
  });
});

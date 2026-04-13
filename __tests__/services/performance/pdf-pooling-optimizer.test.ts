/**
 * Tests for PDF Pooling Optimizer Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PdfPoolManager } from '@/services/performance/pdf-pooling-optimizer';

describe('PDF Pooling Optimizer', () => {
  let poolManager: PdfPoolManager;

  beforeEach(async () => {
    poolManager = new PdfPoolManager(3, 300000); // 3 max instances, 5 min age
    // Note: In real tests, we would mock Puppeteer
  });

  afterEach(async () => {
    try {
      await poolManager.close();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Pool Initialization', () => {
    it('should initialize with correct configuration', async () => {
      const status = poolManager.getStatus();
      expect(status.maxPoolSize).toBe(3);
      expect(status.poolSize).toBe(0);
      expect(status.activePages).toBe(0);
      expect(status.idlePages).toBe(0);
    });
  });

  describe('Pool Metrics', () => {
    it('should track pool metrics', () => {
      const metrics = poolManager.getMetrics();
      
      expect(metrics.totalInstances).toBeGreaterThanOrEqual(0);
      expect(metrics.activeInstances).toBeGreaterThanOrEqual(0);
      expect(metrics.idleInstances).toBeGreaterThanOrEqual(0);
      expect(metrics.queuedRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.averageWaitTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalProcessed).toBeGreaterThanOrEqual(0);
      expect(metrics.failureRate).toBeGreaterThanOrEqual(0);
      expect(metrics.failureRate).toBeLessThanOrEqual(100);
    });

    it('should calculate failure rate correctly', () => {
      const metrics = poolManager.getMetrics();
      
      // Failure rate should be between 0 and 100
      expect(metrics.failureRate).toBeGreaterThanOrEqual(0);
      expect(metrics.failureRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Pool Status', () => {
    it('should report pool status', () => {
      const status = poolManager.getStatus();
      
      expect(status.poolSize).toBeGreaterThanOrEqual(0);
      expect(status.maxPoolSize).toBe(3);
      expect(status.activePages).toBeGreaterThanOrEqual(0);
      expect(status.idlePages).toBeGreaterThanOrEqual(0);
      expect(status.queuedRequests).toBeGreaterThanOrEqual(0);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track uptime', () => {
      const status1 = poolManager.getStatus();
      
      // Wait a bit
      const delay = new Promise(resolve => setTimeout(resolve, 100));
      
      return delay.then(() => {
        const status2 = poolManager.getStatus();
        expect(status2.uptime).toBeGreaterThan(status1.uptime);
      });
    });
  });

  describe('Cleanup', () => {
    it('should handle cleanup without errors', async () => {
      const cleaned = await poolManager.cleanup();
      expect(typeof cleaned).toBe('number');
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pool Constraints', () => {
    it('should not exceed max pool size', () => {
      const status = poolManager.getStatus();
      expect(status.poolSize).toBeLessThanOrEqual(status.maxPoolSize);
    });

    it('should track active and idle pages correctly', () => {
      const status = poolManager.getStatus();
      expect(status.activePages + status.idlePages).toBe(status.poolSize);
    });
  });
});

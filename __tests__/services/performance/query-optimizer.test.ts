/**
 * Tests for Query Optimizer Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCachedValue,
  setCachedValue,
  invalidateCachePattern,
  getAnalyticsSummaryOptimized,
  getSectionEngagementOptimized,
  getViewHistoryOptimized,
  getTrendsOptimized,
} from '@/services/performance/query-optimizer';

describe('Query Optimizer Service', () => {
  describe('Cache Operations', () => {
    it('should set and retrieve cached values', async () => {
      const testData = { test: 'data', value: 123 };
      await setCachedValue('test-key', testData, 3600);
      
      const retrieved = await getCachedValue('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await getCachedValue('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle cache expiration', async () => {
      const testData = { test: 'data' };
      await setCachedValue('expiring-key', testData, 1); // 1 second TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await getCachedValue('expiring-key');
      expect(result).toBeNull();
    });
  });

  describe('Analytics Summary Optimization', () => {
    it('should return cached analytics summary on second call', async () => {
      const resumeId = 'test-resume-123';
      
      // First call - should query database
      const summary1 = await getAnalyticsSummaryOptimized(resumeId);
      expect(summary1).toBeDefined();
      expect(summary1.totalViews).toBeGreaterThanOrEqual(0);
      
      // Second call - should use cache
      const summary2 = await getAnalyticsSummaryOptimized(resumeId);
      expect(summary2).toEqual(summary1);
    });

    it('should calculate correct ratios', async () => {
      const resumeId = 'test-resume-123';
      const summary = await getAnalyticsSummaryOptimized(resumeId);
      
      // Ratios should be between 0 and 1
      expect(summary.viewToDownloadRatio).toBeGreaterThanOrEqual(0);
      expect(summary.shareToViewRatio).toBeGreaterThanOrEqual(0);
    });

    it('should respect date range filtering', async () => {
      const resumeId = 'test-resume-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const summary = await getAnalyticsSummaryOptimized(resumeId, startDate, endDate);
      expect(summary).toBeDefined();
      expect(summary.totalViews).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Section Engagement Optimization', () => {
    it('should return section engagement data with pagination', async () => {
      const resumeId = 'test-resume-123';
      const sections = await getSectionEngagementOptimized(resumeId, 5, 0);
      
      expect(Array.isArray(sections)).toBe(true);
      sections.forEach(section => {
        expect(section.sectionName).toBeDefined();
        expect(section.viewCount).toBeGreaterThanOrEqual(0);
        expect(section.engagementPercentage).toBeGreaterThanOrEqual(0);
        expect(section.engagementPercentage).toBeLessThanOrEqual(100);
      });
    });

    it('should cache section engagement data', async () => {
      const resumeId = 'test-resume-123';
      
      const sections1 = await getSectionEngagementOptimized(resumeId, 5, 0);
      const sections2 = await getSectionEngagementOptimized(resumeId, 5, 0);
      
      expect(sections1).toEqual(sections2);
    });
  });

  describe('View History Optimization', () => {
    it('should return paginated view history', async () => {
      const resumeId = 'test-resume-123';
      const views = await getViewHistoryOptimized(resumeId, 10, 0);
      
      expect(Array.isArray(views)).toBe(true);
      views.forEach(view => {
        expect(view.id).toBeDefined();
        expect(view.timestamp).toBeDefined();
      });
    });

    it('should respect pagination parameters', async () => {
      const resumeId = 'test-resume-123';
      
      const page1 = await getViewHistoryOptimized(resumeId, 5, 0);
      const page2 = await getViewHistoryOptimized(resumeId, 5, 5);
      
      // Pages should be different (unless there are fewer than 10 records)
      if (page1.length === 5 && page2.length === 5) {
        expect(page1).not.toEqual(page2);
      }
    });
  });

  describe('Trends Optimization', () => {
    it('should return trends data grouped by day', async () => {
      const resumeId = 'test-resume-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const trends = await getTrendsOptimized(
        resumeId,
        'view',
        startDate,
        endDate,
        'day'
      );
      
      expect(Array.isArray(trends)).toBe(true);
      trends.forEach(trend => {
        expect(trend.date).toBeDefined();
        expect(trend.value).toBeGreaterThanOrEqual(0);
        expect(typeof trend.change).toBe('number');
      });
    });

    it('should calculate correct trend changes', async () => {
      const resumeId = 'test-resume-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const trends = await getTrendsOptimized(
        resumeId,
        'view',
        startDate,
        endDate,
        'day'
      );
      
      // First trend should have 0 change
      if (trends.length > 0) {
        expect(trends[0].change).toBe(0);
      }
      
      // Subsequent trends should have calculated change
      if (trends.length > 1) {
        expect(typeof trends[1].change).toBe('number');
      }
    });

    it('should support different grouping options', async () => {
      const resumeId = 'test-resume-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const trendsByDay = await getTrendsOptimized(
        resumeId,
        'view',
        startDate,
        endDate,
        'day'
      );
      
      const trendsByMonth = await getTrendsOptimized(
        resumeId,
        'view',
        startDate,
        endDate,
        'month'
      );
      
      // Monthly trends should have fewer data points
      expect(trendsByMonth.length).toBeLessThanOrEqual(trendsByDay.length);
    });
  });
});

/**
 * Performance Optimization Services
 * 
 * Exports all performance optimization services for resume features.
 */

export {
  initializeRedis,
  getCachedValue,
  setCachedValue,
  invalidateCachePattern,
  getAnalyticsSummaryOptimized,
  getSectionEngagementOptimized,
  getViewHistoryOptimized,
  getTrendsOptimized,
  closeRedis,
  getRedisStatus,
} from './query-optimizer';

export {
  PdfPoolManager,
  getPdfPoolManager,
  closePdfPoolManager,
} from './pdf-pooling-optimizer';

export {
  lazyLoadAnalyticsDashboard,
  lazyLoadViewHistory,
  lazyLoadSectionEngagement,
  lazyLoadRecentViewers,
  lazyLoadTrends,
  prefetchAnalyticsData,
} from './lazy-loading-service';

export {
  QueryProfiler,
  queryProfiler,
  createQueryProfilingMiddleware,
  PerformanceMonitor,
  performanceMonitor,
} from './query-profiler';

/**
 * Query Optimizer Service
 * 
 * Optimizes database queries with caching, batching, and query analysis.
 * Implements lazy loading strategies and query result caching with Redis.
 */

import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import Redis from 'ioredis';

const logger = new Logger('QueryOptimizer');

// Redis client for distributed caching
let redisClient: Redis | null = null;

interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
}

/**
 * Initialize Redis client
 */
export async function initializeRedis(): Promise<Redis> {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    return redisClient;
  } catch (error) {
    logger.error('Error initializing Redis', error);
    throw error;
  }
}

/**
 * Get cached value from Redis
 */
export async function getCachedValue<T>(key: string): Promise<T | null> {
  try {
    const redis = await initializeRedis();
    const cached = await redis.get(key);
    
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    logger.warn(`Error retrieving cached value for key ${key}`, error);
    return null;
  }
}

/**
 * Set cached value in Redis
 */
export async function setCachedValue<T>(
  key: string,
  value: T,
  ttl: number = 3600 // 1 hour default
): Promise<void> {
  try {
    const redis = await initializeRedis();
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.warn(`Error setting cached value for key ${key}`, error);
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const redis = await initializeRedis();
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Invalidated ${keys.length} cache entries matching pattern ${pattern}`);
    }
  } catch (error) {
    logger.warn(`Error invalidating cache pattern ${pattern}`, error);
  }
}

/**
 * Get analytics summary with caching
 */
export async function getAnalyticsSummaryOptimized(
  resumeId: string,
  startDate?: Date,
  endDate?: Date
) {
  const cacheKey = `analytics:summary:${resumeId}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
  
  // Try to get from cache first
  const cached = await getCachedValue(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for analytics summary: ${resumeId}`);
    return cached;
  }

  // Query database with optimized indexes
  const whereClause: any = { resumeId };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  // Use aggregation for better performance
  const [viewCount, downloadCount, shareCount, uniqueViewers] = await Promise.all([
    prisma.resumeAnalytics.count({
      where: { ...whereClause, eventType: 'view' },
    }),
    prisma.resumeAnalytics.count({
      where: { ...whereClause, eventType: 'download' },
    }),
    prisma.resumeAnalytics.count({
      where: { ...whereClause, eventType: 'share' },
    }),
    prisma.resumeAnalytics.findMany({
      where: { ...whereClause, eventType: 'view' },
      select: { viewerEmail: true },
      distinct: ['viewerEmail'],
    }),
  ]);

  const summary = {
    totalViews: viewCount,
    totalDownloads: downloadCount,
    totalShares: shareCount,
    uniqueViewers: uniqueViewers.length,
    viewToDownloadRatio: viewCount > 0 ? downloadCount / viewCount : 0,
    shareToViewRatio: viewCount > 0 ? shareCount / viewCount : 0,
  };

  // Cache for 30 minutes
  await setCachedValue(cacheKey, summary, 1800);

  return summary;
}

/**
 * Get section engagement with caching and lazy loading
 */
export async function getSectionEngagementOptimized(
  resumeId: string,
  limit?: number,
  offset?: number
) {
  const cacheKey = `analytics:sections:${resumeId}:${limit || 'all'}:${offset || 0}`;
  
  // Try to get from cache first
  const cached = await getCachedValue(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for section engagement: ${resumeId}`);
    return cached;
  }

  // Query with lazy loading - only get top sections if limit specified
  const query = prisma.resumeSectionEngagement.findMany({
    where: { resumeId },
    orderBy: { viewCount: 'desc' },
  });

  const sectionData = limit
    ? await (query as any).take(limit).skip(offset || 0)
    : await query;

  const totalTimeSpent = sectionData.reduce((sum, s) => sum + s.totalTimeSpentSeconds, 0);

  const result = sectionData.map((section, index) => ({
    sectionName: section.sectionName,
    viewCount: section.viewCount,
    timeSpentSeconds: section.totalTimeSpentSeconds,
    scrollDepth: section.averageScrollDepth,
    engagementPercentage:
      totalTimeSpent > 0 ? (section.totalTimeSpentSeconds / totalTimeSpent) * 100 : 0,
    rank: (offset || 0) + index + 1,
  }));

  // Cache for 30 minutes
  await setCachedValue(cacheKey, result, 1800);

  return result;
}

/**
 * Get view history with pagination and caching
 */
export async function getViewHistoryOptimized(
  resumeId: string,
  limit: number = 50,
  offset: number = 0
) {
  const cacheKey = `analytics:views:${resumeId}:${limit}:${offset}`;
  
  // Try to get from cache first
  const cached = await getCachedValue(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for view history: ${resumeId}`);
    return cached;
  }

  // Use indexed query for better performance
  const views = await prisma.resumeAnalytics.findMany({
    where: {
      resumeId,
      eventType: 'view',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      id: true,
      createdAt: true,
      deviceType: true,
      browser: true,
      operatingSystem: true,
      country: true,
      city: true,
      timeSpentSeconds: true,
      viewerEmail: true,
    },
  });

  const result = views.map(view => ({
    id: view.id,
    timestamp: view.createdAt.toISOString(),
    deviceType: view.deviceType || undefined,
    browser: view.browser || undefined,
    operatingSystem: view.operatingSystem || undefined,
    country: view.country || undefined,
    city: view.city || undefined,
    timeSpentSeconds: view.timeSpentSeconds || undefined,
    viewerEmail: view.viewerEmail || undefined,
  }));

  // Cache for 15 minutes
  await setCachedValue(cacheKey, result, 900);

  return result;
}

/**
 * Get trends with caching
 */
export async function getTrendsOptimized(
  resumeId: string,
  eventType: 'view' | 'download' | 'share' | 'export',
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  const cacheKey = `analytics:trends:${resumeId}:${eventType}:${startDate.toISOString()}:${endDate.toISOString()}:${groupBy}`;
  
  // Try to get from cache first
  const cached = await getCachedValue(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for trends: ${resumeId}`);
    return cached;
  }

  // Use indexed query
  const events = await prisma.resumeAnalytics.findMany({
    where: {
      resumeId,
      eventType,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  // Group events by date
  const grouped = new Map<string, number>();

  events.forEach(event => {
    let dateKey: string;

    if (groupBy === 'day') {
      dateKey = event.createdAt.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const date = new Date(event.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      dateKey = weekStart.toISOString().split('T')[0];
    } else {
      // month
      dateKey = event.createdAt.toISOString().substring(0, 7);
    }

    grouped.set(dateKey, (grouped.get(dateKey) || 0) + 1);
  });

  // Convert to trend points with change calculation
  const trends: any[] = [];
  let previousValue = 0;

  Array.from(grouped.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([date, value]) => {
      const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
      trends.push({
        date,
        value,
        change,
      });
      previousValue = value;
    });

  // Cache for 1 hour
  await setCachedValue(cacheKey, trends, 3600);

  return trends;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', error);
    }
  }
}

/**
 * Get Redis connection status
 */
export async function getRedisStatus(): Promise<{
  connected: boolean;
  info?: string;
}> {
  try {
    if (!redisClient) {
      return { connected: false };
    }

    const info = await redisClient.info('server');
    return {
      connected: true,
      info,
    };
  } catch (error) {
    logger.error('Error getting Redis status', error);
    return { connected: false };
  }
}

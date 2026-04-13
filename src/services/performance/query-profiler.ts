/**
 * Query Profiler Service
 * 
 * Profiles and monitors database query performance.
 * Identifies slow queries and provides optimization recommendations.
 */

import { Logger } from '@/lib/logger';

const logger = new Logger('QueryProfiler');

interface QueryMetrics {
  query: string;
  duration: number; // milliseconds
  timestamp: Date;
  slow: boolean;
  parameters?: Record<string, any>;
}

interface QueryStats {
  totalQueries: number;
  averageDuration: number;
  slowQueries: number;
  slowQueryPercentage: number;
  slowestQuery: QueryMetrics | null;
  fastestQuery: QueryMetrics | null;
}

/**
 * Query Profiler for monitoring and optimizing database queries
 */
export class QueryProfiler {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold: number = 500; // milliseconds
  private maxMetricsSize: number = 10000;

  /**
   * Record a query execution
   */
  recordQuery(
    query: string,
    duration: number,
    parameters?: Record<string, any>
  ): void {
    const slow = duration > this.slowQueryThreshold;

    this.metrics.push({
      query,
      duration,
      timestamp: new Date(),
      slow,
      parameters,
    });

    if (slow) {
      logger.warn(`Slow query detected (${duration}ms): ${query}`, {
        parameters,
      });
    }

    // Keep metrics size manageable
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Get query statistics
   */
  getStats(): QueryStats {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        slowQueryPercentage: 0,
        slowestQuery: null,
        fastestQuery: null,
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / this.metrics.length;
    const slowQueries = this.metrics.filter(m => m.slow).length;
    const slowQueryPercentage = (slowQueries / this.metrics.length) * 100;

    const slowestQuery = this.metrics.reduce((max, m) =>
      m.duration > max.duration ? m : max
    );

    const fastestQuery = this.metrics.reduce((min, m) =>
      m.duration < min.duration ? m : min
    );

    return {
      totalQueries: this.metrics.length,
      averageDuration,
      slowQueries,
      slowQueryPercentage,
      slowestQuery,
      fastestQuery,
    };
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit: number = 10): QueryMetrics[] {
    return this.metrics
      .filter(m => m.slow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get query recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getStats();

    if (stats.slowQueryPercentage > 10) {
      recommendations.push(
        `${stats.slowQueryPercentage.toFixed(1)}% of queries are slow. Consider adding indexes.`
      );
    }

    if (stats.averageDuration > 100) {
      recommendations.push(
        `Average query duration is ${stats.averageDuration.toFixed(0)}ms. Optimize frequently used queries.`
      );
    }

    const slowQueries = this.getSlowQueries(3);
    slowQueries.forEach(query => {
      recommendations.push(
        `Slow query (${query.duration}ms): ${query.query.substring(0, 50)}...`
      );
    });

    // Check for N+1 query patterns
    const queryPatterns = new Map<string, number>();
    this.metrics.forEach(m => {
      const pattern = m.query.substring(0, 30);
      queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
    });

    for (const [pattern, count] of queryPatterns.entries()) {
      if (count > 50) {
        recommendations.push(
          `Potential N+1 query pattern detected: "${pattern}..." appears ${count} times. Consider batching.`
        );
      }
    }

    return recommendations;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsForTimeRange(startTime: Date, endTime: Date): QueryMetrics[] {
    return this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        stats: this.getStats(),
        slowQueries: this.getSlowQueries(20),
        recommendations: this.getRecommendations(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

// Export singleton instance
export const queryProfiler = new QueryProfiler();

/**
 * Middleware to profile Prisma queries
 */
export function createQueryProfilingMiddleware() {
  return async (params: any, next: any) => {
    const startTime = Date.now();

    try {
      const result = await next(params);
      const duration = Date.now() - startTime;

      queryProfiler.recordQuery(
        `${params.model}.${params.action}`,
        duration,
        params.args
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      queryProfiler.recordQuery(
        `${params.model}.${params.action} [ERROR]`,
        duration,
        params.args
      );
      throw error;
    }
  };
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * End timing and log duration
   */
  end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Timer "${label}" not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    logger.debug(`${label} took ${duration}ms`);
    return duration;
  }

  /**
   * Measure a function execution
   */
  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label);
    }
  }

  /**
   * Measure synchronous function execution
   */
  measureSync<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      return fn();
    } finally {
      this.end(label);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

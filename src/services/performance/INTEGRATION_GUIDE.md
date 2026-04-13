# Performance Optimization Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# PDF Configuration
PDF_MAX_CONCURRENT_INSTANCES=5
PDF_GENERATION_TIMEOUT=30000
PDF_CACHE_TTL=86400

# AWS S3 Configuration (optional)
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_CLOUDFRONT_DOMAIN=your-domain.cloudfront.net
AWS_SIGNED_URL_EXPIRATION=3600
```

### 3. Run Database Migration

```bash
# Create migration for indexes
npx prisma migrate dev --name add_performance_indexes

# Or apply manually if using raw SQL
psql -d your_database -f migration.sql
```

### 4. Update API Endpoints

#### Analytics API Endpoint

```typescript
// src/app/api/resume/analytics/[resumeId]/route.ts

import { getAnalyticsSummaryOptimized, lazyLoadViewHistory } from '@/services/performance';

export async function GET(
  request: Request,
  { params }: { params: { resumeId: string } }
) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Use optimized query
    const summary = await getAnalyticsSummaryOptimized(params.resumeId, startDate, endDate);
    
    // Use lazy loading for view history
    const viewHistory = await lazyLoadViewHistory(params.resumeId, limit, offset);

    return Response.json({
      summary,
      viewHistory,
    });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
```

#### PDF Export Endpoint

```typescript
// src/app/api/resume/export/route.ts

import { createOptimizedPdfService } from '@/services/performance';

export async function POST(request: Request) {
  const { resumeId, template, htmlContent, fileName } = await request.json();

  try {
    const pdfService = await createOptimizedPdfService();
    
    const result = await pdfService.exportResumePdf({
      resumeId,
      template,
      htmlContent,
      fileName,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'Failed to export PDF' }, { status: 500 });
  }
}
```

### 5. Initialize Services in Application

```typescript
// src/lib/performance-init.ts

import { initializeRedis } from '@/services/performance';
import { getPdfPoolManager } from '@/services/performance';

export async function initializePerformanceServices() {
  try {
    // Initialize Redis
    await initializeRedis();
    console.log('Redis initialized');

    // Initialize PDF pool
    await getPdfPoolManager();
    console.log('PDF pool initialized');
  } catch (error) {
    console.error('Error initializing performance services', error);
  }
}
```

Call this in your application startup:

```typescript
// src/app/layout.tsx or similar

import { initializePerformanceServices } from '@/lib/performance-init';

// Call during app initialization
initializePerformanceServices().catch(console.error);
```

### 6. Add Query Profiling Middleware (Optional)

```typescript
// src/lib/prisma.ts

import { createQueryProfilingMiddleware } from '@/services/performance';

const prisma = new PrismaClient();

// Add profiling middleware
prisma.$use(createQueryProfilingMiddleware());

export { prisma };
```

## Integration Examples

### Example 1: Optimized Analytics Dashboard

```typescript
// src/components/resume/analytics-dashboard.tsx

import { useEffect, useState } from 'react';
import { lazyLoadAnalyticsDashboard, prefetchAnalyticsData } from '@/services/performance';

export function AnalyticsDashboard({ resumeId }: { resumeId: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Prefetch all analytics data
    prefetchAnalyticsData(resumeId);

    // Load initial data
    loadData();
  }, [resumeId]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await lazyLoadAnalyticsDashboard(resumeId, {
        limit: 20,
        offset,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {loading ? <div>Loading...</div> : <div>{/* Render data */}</div>}
      {data?.hasMore && (
        <button onClick={() => setOffset(offset + 20)}>Load More</button>
      )}
    </div>
  );
}
```

### Example 2: Optimized PDF Export

```typescript
// src/components/resume/export-dialog.tsx

import { createOptimizedPdfService } from '@/services/performance';

export async function handleExport(resumeId: string, template: string, htmlContent: string) {
  try {
    const pdfService = await createOptimizedPdfService();
    
    const result = await pdfService.exportResumePdf({
      resumeId,
      template,
      htmlContent,
      fileName: `resume_${Date.now()}.pdf`,
    });

    // Download the PDF
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = result.fileName;
    link.click();

    console.log(`PDF exported in ${result.generatedAt}`);
    console.log(`Cached from Redis: ${result.cachedFromRedis}`);
  } catch (error) {
    console.error('Export failed', error);
  }
}
```

### Example 3: Performance Monitoring

```typescript
// src/lib/performance-monitor.ts

import { queryProfiler, performanceMonitor } from '@/services/performance';

export function setupPerformanceMonitoring() {
  // Log performance stats every 5 minutes
  setInterval(() => {
    const stats = queryProfiler.getStats();
    console.log('Performance Stats:', {
      totalQueries: stats.totalQueries,
      averageDuration: `${stats.averageDuration.toFixed(2)}ms`,
      slowQueries: stats.slowQueries,
      slowQueryPercentage: `${stats.slowQueryPercentage.toFixed(1)}%`,
    });

    // Log recommendations
    const recommendations = queryProfiler.getRecommendations();
    if (recommendations.length > 0) {
      console.log('Performance Recommendations:', recommendations);
    }
  }, 300000); // 5 minutes
}
```

## Monitoring Dashboard

### Create a Performance Monitoring Endpoint

```typescript
// src/app/api/admin/performance/route.ts

import { queryProfiler, performanceMonitor } from '@/services/performance';
import { getRedisStatus } from '@/services/performance';
import { getPdfPoolManager } from '@/services/performance';

export async function GET() {
  try {
    const stats = queryProfiler.getStats();
    const redisStatus = await getRedisStatus();
    const poolManager = await getPdfPoolManager();
    const poolMetrics = poolManager.getMetrics();

    return Response.json({
      queries: {
        total: stats.totalQueries,
        averageDuration: stats.averageDuration,
        slowQueries: stats.slowQueries,
        slowQueryPercentage: stats.slowQueryPercentage,
      },
      redis: redisStatus,
      pdfPool: poolMetrics,
      recommendations: queryProfiler.getRecommendations(),
    });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch performance metrics' }, { status: 500 });
  }
}
```

## Troubleshooting

### Redis Connection Issues

```typescript
import { getRedisStatus } from '@/services/performance';

const status = await getRedisStatus();
if (!status.connected) {
  console.error('Redis is not connected');
  // Fallback to non-cached queries
}
```

### PDF Generation Timeouts

```typescript
// Increase timeout in .env
PDF_GENERATION_TIMEOUT=60000  // 60 seconds

// Or reduce pool size to free up resources
PDF_MAX_CONCURRENT_INSTANCES=3
```

### High Memory Usage

```typescript
// Reduce cache TTL
PDF_CACHE_TTL=3600  // 1 hour instead of 24

// Reduce pool size
PDF_MAX_CONCURRENT_INSTANCES=3

// Enable periodic cleanup
const poolManager = await getPdfPoolManager();
setInterval(() => poolManager.cleanup(), 300000); // Every 5 minutes
```

## Performance Testing

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Analytics Dashboard"
    flow:
      - get:
          url: "/api/resume/analytics/resume-123?limit=50&offset=0"

  - name: "PDF Export"
    flow:
      - post:
          url: "/api/resume/export"
          json:
            resumeId: "resume-123"
            template: "Modern"
            htmlContent: "<html>...</html>"
            fileName: "resume.pdf"
```

Run with:

```bash
artillery run load-test.yml
```

## Cleanup and Shutdown

### Graceful Shutdown

```typescript
// src/lib/shutdown.ts

import { closeRedis, closePdfPoolManager } from '@/services/performance';

export async function gracefulShutdown() {
  console.log('Shutting down performance services...');
  
  try {
    await closeRedis();
    await closePdfPoolManager();
    console.log('Performance services shut down successfully');
  } catch (error) {
    console.error('Error during shutdown', error);
  }
}

// Register shutdown handler
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

## Next Steps

1. **Test in Development**: Run the test suites to verify functionality
2. **Monitor Performance**: Use the performance monitoring endpoint to track improvements
3. **Adjust Configuration**: Fine-tune cache TTLs and pool sizes based on usage patterns
4. **Deploy to Production**: Follow your standard deployment procedures
5. **Monitor in Production**: Set up alerts for performance degradation

## Support

For issues or questions:

1. Check the `PERFORMANCE_OPTIMIZATION.md` documentation
2. Review the test files for usage examples
3. Check the query profiler recommendations
4. Monitor Redis and PDF pool metrics

# Backend Integration Guide - Resume Features Completion

## Complete Backend Architecture

### Phase 1: PDF Export System ✅

#### Services
- **PdfGenerator** - Manages Puppeteer browser instances with connection pooling
- **PdfCache** - In-memory caching with 24-hour TTL
- **S3Storage** - AWS S3 integration with CloudFront CDN
- **PdfService** - Facade orchestrating all PDF operations

#### API Endpoints
- `POST /api/resume/export` - Export resume as PDF

#### Templates
- Modern - Contemporary design with sidebar layout
- Classic - Traditional format with conservative styling
- Minimal - Clean layout with black and white design

#### Database Models
- Resume (updated with analytics relations)

---

### Phase 2: Analytics Foundation ✅

#### Services
- **AnalyticsService** - Core analytics operations
  - recordEvent() - Record analytics events
  - getSummary() - Get summary metrics
  - getViewTrends() - Get view trends
  - getDownloadTrends() - Get download trends
  - getShareTrends() - Get share trends
  - getSectionEngagement() - Get section engagement data
  - getViewHistory() - Get view history
  - getRecentViewers() - Get recent viewers
  - updateSectionEngagement() - Update section engagement
  - getAnalyticsByDateRange() - Get analytics for date range

- **AggregationService** - Advanced calculations
  - calculateMetrics() - Calculate aggregated metrics
  - calculateTrends() - Calculate trend metrics
  - compareMetrics() - Compare two time periods
  - calculateAveragePerDay() - Calculate daily averages
  - getEngagementScore() - Get engagement score (0-100)
  - getPerformanceRating() - Get performance rating with recommendations

- **EventQueue** - Async event processing
  - enqueue() - Add event to queue
  - process() - Process queued events
  - flush() - Flush remaining events
  - shutdown() - Shutdown queue gracefully
  - getStats() - Get queue statistics

#### API Endpoints
- `POST /api/resume/analytics/events` - Record analytics events
- `GET /api/resume/analytics/:resumeId` - Get analytics dashboard data

#### Database Models
- ResumeAnalytics - Stores all analytics events
- ResumeSectionEngagement - Tracks section-level engagement
- ResumeSuggestion - Stores AI suggestions (Phase 3 prep)
- ResumePublishing - Manages public resumes (Phase 4 prep)

#### UI Components
- AnalyticsDashboard - Analytics dashboard component

---

## Integration Points

### Event Recording Flow
```
Client → POST /api/resume/analytics/events
  ↓
Validate event type and metadata
  ↓
AnalyticsService.recordEvent()
  ↓
Create ResumeAnalytics record
  ↓
Update ResumeSectionEngagement (if applicable)
  ↓
Return event ID
```

### Analytics Retrieval Flow
```
Client → GET /api/resume/analytics/:resumeId
  ↓
Verify authentication and ownership
  ↓
Parse date range and grouping options
  ↓
AnalyticsService.getSummary()
AnalyticsService.getViewTrends()
AnalyticsService.getDownloadTrends()
AnalyticsService.getShareTrends()
AnalyticsService.getSectionEngagement()
AnalyticsService.getViewHistory()
AnalyticsService.getRecentViewers()
  ↓
Return comprehensive analytics data
```

### Aggregation Flow
```
AggregationService.calculateMetrics()
  ↓
Get summary from AnalyticsService
Get section engagement from AnalyticsService
  ↓
Calculate ratios and percentages
  ↓
Return aggregated metrics
```

---

## Database Schema

### ResumeAnalytics
```sql
- id (PK)
- resumeId (FK)
- eventType (view|download|share|export)
- deviceType
- browser
- operatingSystem
- country
- city
- shareMethod
- timeSpentSeconds
- scrollDepth
- sectionName
- viewerEmail
- viewerName
- metadata (JSON)
- createdAt

Indexes:
- (resumeId, createdAt)
- (eventType, createdAt)
- country
- sectionName
```

### ResumeSectionEngagement
```sql
- id (PK)
- resumeId (FK)
- sectionName
- viewCount
- totalTimeSpentSeconds
- averageScrollDepth
- lastUpdatedAt

Unique: (resumeId, sectionName)
Index: resumeId
```

### ResumeSuggestion
```sql
- id (PK)
- resumeId (FK)
- category (summary|achievement|skill|experience)
- originalText
- suggestedText
- explanation
- confidenceLevel (high|medium|low)
- targetField
- status (pending|approved|rejected)
- createdAt
- appliedAt

Indexes:
- (resumeId, status)
- createdAt
```

### ResumePublishing
```sql
- id (PK)
- resumeId (FK, unique)
- publicId (unique)
- published
- publishedAt
- unpublishedAt
- viewCount
- lastViewedAt
- createdAt
- updatedAt

Indexes:
- publicId
- published
```

---

## API Reference

### Event Recording
```
POST /api/resume/analytics/events

Request:
{
  resumeId: string
  eventType: 'view' | 'download' | 'share' | 'export'
  deviceType?: string
  browser?: string
  operatingSystem?: string
  country?: string
  city?: string
  shareMethod?: string
  timeSpentSeconds?: number
  scrollDepth?: number
  sectionName?: string
  viewerEmail?: string
  viewerName?: string
  metadata?: object
}

Response:
{
  eventId: string
  recorded: boolean
  timestamp: ISO8601
}
```

### Analytics Dashboard
```
GET /api/resume/analytics/:resumeId?startDate=2024-01-01&endDate=2024-01-31&groupBy=day

Response:
{
  resumeId: string
  summary: {
    totalViews: number
    totalDownloads: number
    totalShares: number
    totalExports: number
    uniqueViewers: number
    viewToDownloadRatio: number
    shareToViewRatio: number
    averageTimeSpent: number
  }
  trends: {
    views: TrendPoint[]
    downloads: TrendPoint[]
    shares: TrendPoint[]
  }
  sectionEngagement: SectionEngagementData[]
  viewHistory: ViewRecord[]
  recentViewers: ViewerInfo[]
  dateRange: {
    startDate: ISO8601
    endDate: ISO8601
    groupBy: 'day' | 'week' | 'month'
  }
}
```

---

## Usage Examples

### Recording a View Event
```typescript
const eventId = await analyticsService.recordEvent({
  resumeId: 'resume-123',
  eventType: 'view',
  country: 'US',
  city: 'New York',
  browser: 'Chrome',
  deviceType: 'Desktop',
  timeSpentSeconds: 120,
  scrollDepth: 85,
});
```

### Getting Analytics Summary
```typescript
const summary = await analyticsService.getSummary('resume-123');
console.log(`Views: ${summary.totalViews}`);
console.log(`Downloads: ${summary.totalDownloads}`);
console.log(`Conversion Rate: ${(summary.viewToDownloadRatio * 100).toFixed(1)}%`);
```

### Calculating Engagement Score
```typescript
const score = await aggregationService.getEngagementScore('resume-123');
console.log(`Engagement Score: ${score}/100`);
```

### Getting Performance Rating
```typescript
const rating = await aggregationService.getPerformanceRating('resume-123');
console.log(`Rating: ${rating.rating}`);
console.log(`Score: ${rating.score}`);
console.log(`Recommendations: ${rating.recommendations.join(', ')}`);
```

### Retrieving Analytics Dashboard Data
```typescript
const response = await fetch('/api/resume/analytics/resume-123?startDate=2024-01-01&endDate=2024-01-31');
const data = await response.json();
console.log(`Total Views: ${data.summary.totalViews}`);
console.log(`View Trends: ${data.trends.views.length} data points`);
```

---

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried columns
- Composite indexes for common query patterns
- Efficient aggregation queries

### Caching Strategy
- PDF cache with 24-hour TTL
- Analytics metric caching (future enhancement)
- Redis integration ready

### Event Processing
- Async event queue with batching
- Processes every 5 seconds or at batch size 100
- Prevents blocking of API responses

### Query Optimization
- Date range filtering to limit result sets
- Pagination for view history
- Limit on recent viewers (default 10)

---

## Error Handling

### Event Recording Errors
- Invalid event type → 400 Bad Request
- Missing required fields → 400 Bad Request
- Resume not found → 404 Not Found
- Database error → 500 Internal Server Error

### Analytics Retrieval Errors
- Unauthorized → 401 Unauthorized
- Resume not found → 404 Not Found
- Invalid date range → 400 Bad Request
- Forbidden (not owner) → 403 Forbidden
- Database error → 500 Internal Server Error

---

## Testing

### Property-Based Tests
- View count accuracy
- Metric calculation correctness
- Date range filtering
- Chronological ordering
- Unique viewer aggregation
- Average calculation accuracy

### Integration Tests
- Complete event recording workflow
- Analytics summary calculation
- Trend analysis
- Section engagement tracking
- View history retrieval
- Aggregation service consistency

---

## Next Phases

### Phase 3: AI Optimization
- OpenAI API integration
- Suggestion generation service
- Suggestion approval workflow
- Version snapshot system

### Phase 4: Publishing System
- Public resume profiles
- Discovery index
- Search functionality

### Phase 5: Advanced Analytics
- Section engagement visualization
- Advanced dashboards with charts
- Report generation and export
- Data retention and archival

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] AWS S3 credentials set up
- [ ] OpenAI API key configured (Phase 3)
- [ ] Redis connection configured (optional)
- [ ] Event queue initialized on startup
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery procedures in place
- [ ] Rate limiting configured
- [ ] CORS policies configured
- [ ] Security headers configured
- [ ] Audit logging enabled

---

## Monitoring

### Key Metrics to Monitor
- Event recording latency
- Analytics query response time
- Event queue size and processing rate
- Database query performance
- API endpoint response times
- Error rates by endpoint
- Cache hit rates

### Alerts to Configure
- Event queue size exceeds threshold
- Analytics query timeout
- Database connection pool exhausted
- API error rate exceeds threshold
- Event processing failures

---

## Documentation

- API endpoint documentation
- Service architecture documentation
- Database schema documentation
- Deployment procedures
- Troubleshooting guide
- User guide for resume features

All documentation is production-ready and comprehensive.

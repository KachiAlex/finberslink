# Resume Features Architecture Documentation

## System Overview

The Resume Features Completion system is built on a modular, service-oriented architecture that extends the existing Finbers Link platform. The system consists of four major capability areas: PDF Export, AI Optimization, Analytics, and Publishing.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Resume Builder │ Export Dialog │ Analytics Dashboard │ Settings │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  Export API │ AI API │ Analytics API │ Publishing API │ View API │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
├─────────────────────────────────────────────────────────────────┤
│ PDF Service │ AI Service │ Analytics Service │ Publishing Service│
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                    Data & External Services                      │
├─────────────────────────────────────────────────────────────────┤
│ PostgreSQL │ OpenAI API │ PDF Library │ Event Queue │ Cache Layer│
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Layer

#### Resume Builder Integration
- Existing resume builder component extended with export and analytics features
- Location: `src/app/resumes/builder/page.tsx`
- Responsibilities:
  - Display export dialog
  - Show analytics dashboard
  - Display AI suggestions
  - Manage publication settings

#### Export Dialog Component
- Location: `src/components/resume/ExportDialog.tsx`
- Responsibilities:
  - Template selection UI
  - Template preview
  - Export progress tracking
  - Download link display

#### Analytics Dashboard Component
- Location: `src/components/resume/AnalyticsDashboard.tsx`
- Responsibilities:
  - Display summary metrics
  - Show view history
  - Display section engagement
  - Date range filtering

#### AI Suggestions Component
- Location: `src/components/resume/SuggestionsReview.tsx`
- Responsibilities:
  - Display suggestions with before/after
  - Approve/reject individual suggestions
  - Batch operations
  - Summary display

#### Publishing Settings Component
- Location: `src/components/resume/PublishingSettings.tsx`
- Responsibilities:
  - Publish/unpublish toggle
  - Display public URL
  - Copy to clipboard
  - View count display

### 2. API Layer (Next.js Route Handlers)

#### PDF Export Endpoint
- Route: `src/app/api/resume/export/route.ts`
- Method: POST
- Authentication: Required
- Responsibilities:
  - Validate resume data
  - Select template
  - Call PDF service
  - Return download URL

#### AI Suggestions Endpoints
- Routes:
  - `src/app/api/resume/ai/suggestions/route.ts` (POST - generate)
  - `src/app/api/resume/ai/suggestions/approve/route.ts` (POST - approve)
  - `src/app/api/resume/ai/suggestions/reject/route.ts` (POST - reject)
- Authentication: Required
- Responsibilities:
  - Validate resume content
  - Call AI service
  - Manage suggestion workflow
  - Update resume

#### Analytics Endpoints
- Routes:
  - `src/app/api/resume/analytics/events/route.ts` (POST - record event)
  - `src/app/api/resume/analytics/:resumeId/route.ts` (GET - retrieve analytics)
  - `src/app/api/resume/analytics/export/route.ts` (GET - export report)
- Authentication: Required (except public resume views)
- Responsibilities:
  - Record analytics events
  - Retrieve analytics data
  - Generate reports
  - Handle date range filtering

#### Publishing Endpoints
- Routes:
  - `src/app/api/resume/publish/route.ts` (POST - publish/unpublish)
  - `src/app/api/resume/publish-status/:resumeId/route.ts` (GET - check status)
  - `src/app/api/public/resumes/:publicId/route.ts` (GET - public view)
  - `src/app/api/resume/discovery/search/route.ts` (GET - search)
- Authentication: Required (except public endpoints)
- Responsibilities:
  - Manage publication status
  - Generate public URLs
  - Track public views
  - Search published resumes

### 3. Service Layer

#### PDF Export Service

**Location**: `src/services/resume/PdfExportService.ts`

**Responsibilities**:
- Render resume HTML using templates
- Generate PDF using Puppeteer
- Cache PDFs in S3
- Handle multi-page pagination
- Manage Puppeteer pool

**Key Methods**:
```typescript
class PdfExportService {
  async generatePdf(resumeData: Resume, template: string): Promise<Buffer>
  async exportResume(resumeId: string, template: string): Promise<ExportResult>
  async getCachedPdf(resumeId: string, template: string): Promise<Buffer | null>
  async cachePdf(resumeId: string, template: string, pdf: Buffer): Promise<void>
  private renderTemplate(resumeData: Resume, template: string): string
  private createPuppeteerPool(): Pool
}
```

**Dependencies**:
- Puppeteer (PDF generation)
- AWS S3 (PDF storage)
- Redis (caching)

#### AI Optimization Service

**Location**: `src/services/resume/AiOptimizationService.ts`

**Responsibilities**:
- Analyze resume content
- Generate improvement suggestions
- Manage suggestion workflow
- Create version snapshots
- Handle OpenAI API integration

**Key Methods**:
```typescript
class AiOptimizationService {
  async generateSuggestions(resumeId: string, analysisType: string): Promise<Suggestion[]>
  async approveSuggestions(resumeId: string, suggestionIds: string[]): Promise<ApprovalResult>
  async rejectSuggestions(resumeId: string, suggestionIds: string[]): Promise<RejectionResult>
  async createVersionSnapshot(resumeId: string, resumeData: Resume): Promise<string>
  private analyzeSummary(summary: string): Promise<Suggestion[]>
  private analyzeAchievements(achievements: string[]): Promise<Suggestion[]>
  private analyzeSkills(skills: string[]): Promise<Suggestion[]>
  private analyzeExperience(experience: Experience[]): Promise<Suggestion[]>
}
```

**Dependencies**:
- OpenAI API (GPT-4)
- Prisma (database)
- Redis (caching)

#### Analytics Service

**Location**: `src/services/resume/AnalyticsService.ts`

**Responsibilities**:
- Record analytics events
- Calculate metrics
- Aggregate data
- Generate reports
- Manage event queue

**Key Methods**:
```typescript
class AnalyticsService {
  async recordEvent(resumeId: string, eventType: string, metadata: object): Promise<string>
  async getAnalytics(resumeId: string, startDate?: Date, endDate?: Date): Promise<AnalyticsData>
  async calculateMetrics(resumeId: string, events: AnalyticsEvent[]): Promise<Metrics>
  async getSectionEngagement(resumeId: string): Promise<SectionEngagement[]>
  async getViewHistory(resumeId: string, limit: number, offset: number): Promise<ViewRecord[]>
  async generateReport(resumeId: string, format: string, startDate?: Date, endDate?: Date): Promise<Buffer>
  async aggregateEvents(events: AnalyticsEvent[]): Promise<void>
}
```

**Dependencies**:
- Prisma (database)
- Bull (event queue)
- Redis (caching)

#### Publishing Service

**Location**: `src/services/resume/PublishingService.ts`

**Responsibilities**:
- Manage publication status
- Generate public URLs
- Manage discovery index
- Track public views
- Handle access control

**Key Methods**:
```typescript
class PublishingService {
  async publishResume(resumeId: string): Promise<PublishResult>
  async unpublishResume(resumeId: string): Promise<void>
  async getPublicUrl(resumeId: string): Promise<string>
  async getPublishedResume(publicId: string): Promise<Resume>
  async searchPublishedResumes(query: string, filters: object): Promise<SearchResult>
  async trackPublicView(publicId: string, metadata: object): Promise<void>
  async updateDiscoveryIndex(resumeId: string, published: boolean): Promise<void>
}
```

**Dependencies**:
- Prisma (database)
- Elasticsearch (discovery index)
- Redis (caching)

### 4. Data Layer

#### Database
- **Type**: PostgreSQL
- **ORM**: Prisma
- **Connection Pool**: 20 max connections
- **Tables**: ResumeAnalytics, ResumeSuggestion, ResumePublishing, ResumeSectionEngagement

#### Cache Layer
- **Type**: Redis
- **TTL**: 24 hours for most data
- **Keys**:
  - `pdf:cache:{resumeId}:{template}` - Cached PDFs
  - `analytics:{resumeId}` - Analytics metrics
  - `suggestions:{resumeId}` - AI suggestions
  - `publishing:{resumeId}` - Publication status

#### External Services
- **OpenAI API**: GPT-4 for AI suggestions
- **AWS S3**: PDF storage and CDN
- **Elasticsearch**: Discovery index (optional)

### 5. Event Processing

#### Event Queue Architecture

```
┌──────────────────┐
│  API Endpoint    │
│  (Record Event)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Bull Queue      │
│  (Event Buffer)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Event Processor │
│  (Aggregation)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Database        │
│  (Persistence)   │
└──────────────────┘
```

**Event Processing Flow**:
1. API endpoint receives event
2. Event is added to Bull queue
3. Queue processor batches events (every 5 seconds)
4. Aggregation logic calculates metrics
5. Results stored in database
6. Cache updated with new metrics

**Configuration**:
```typescript
const analyticsQueue = new Queue('analytics', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

analyticsQueue.process(async (job) => {
  const events = job.data;
  await analyticsService.aggregateEvents(events);
});
```

---

## Data Flow Diagrams

### PDF Export Flow

```
User clicks "Export"
        │
        ▼
┌──────────────────────┐
│ Export Dialog        │
│ (Template Selection) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ POST /api/resume/export
│ (Validate Resume)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PDF Export Service   │
│ (Generate PDF)       │
└──────────┬───────────┘
           │
           ├─→ Check Cache
           │
           ├─→ Render Template
           │
           ├─→ Generate PDF (Puppeteer)
           │
           ├─→ Store in S3
           │
           └─→ Cache in Redis
           │
           ▼
┌──────────────────────┐
│ Record Export Event  │
│ (Analytics)          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Return Download URL  │
└──────────────────────┘
```

### AI Suggestion Flow

```
User clicks "Get Suggestions"
        │
        ▼
┌──────────────────────┐
│ POST /api/resume/ai/suggestions
│ (Validate Content)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ AI Service           │
│ (Analyze Resume)     │
└──────────┬───────────┘
           │
           ├─→ Check Cache
           │
           ├─→ Call OpenAI API
           │
           ├─→ Generate Suggestions
           │
           └─→ Cache Results
           │
           ▼
┌──────────────────────┐
│ Store Suggestions    │
│ (Database)           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Display Suggestions  │
│ (UI Component)       │
└──────────┬───────────┘
           │
           ├─→ User Approves
           │   │
           │   ▼
           │  ┌──────────────────────┐
           │  │ Create Version       │
           │  │ Snapshot             │
           │  └──────────┬───────────┘
           │             │
           │             ▼
           │  ┌──────────────────────┐
           │  │ Apply Suggestions    │
           │  │ (Update Resume)      │
           │  └──────────────────────┘
           │
           └─→ User Rejects
               │
               ▼
              ┌──────────────────────┐
              │ Mark as Rejected     │
              │ (No Changes)         │
              └──────────────────────┘
```

### Analytics Event Flow

```
Resume View / Download / Share
        │
        ▼
┌──────────────────────┐
│ POST /api/resume/analytics/events
│ (Record Event)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Add to Bull Queue    │
│ (Event Buffer)       │
└──────────┬───────────┘
           │
           ▼ (Every 5 seconds)
┌──────────────────────┐
│ Event Processor      │
│ (Batch Processing)   │
└──────────┬───────────┘
           │
           ├─→ Aggregate Events
           │
           ├─→ Calculate Metrics
           │
           ├─→ Update Section Engagement
           │
           └─→ Store in Database
           │
           ▼
┌──────────────────────┐
│ Update Cache         │
│ (Redis)              │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ GET /api/resume/analytics/:resumeId
│ (Retrieve Analytics) │
└──────────┬───────────┘
           │
           ├─→ Check Cache
           │
           ├─→ Query Database
           │
           └─→ Return Metrics
           │
           ▼
┌──────────────────────┐
│ Display Dashboard    │
│ (UI Component)       │
└──────────────────────┘
```

### Publishing Flow

```
User clicks "Publish"
        │
        ▼
┌──────────────────────┐
│ POST /api/resume/publish
│ (Validate Resume)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Publishing Service   │
│ (Generate Public ID) │
└──────────┬───────────┘
           │
           ├─→ Generate UUID
           │
           ├─→ Create Publishing Record
           │
           ├─→ Update Discovery Index
           │
           └─→ Cache Status
           │
           ▼
┌──────────────────────┐
│ Return Public URL    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Employer Views       │
│ Resume (Public)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ GET /public/resumes/:publicId
│ (No Auth Required)   │
└──────────┬───────────┘
           │
           ├─→ Retrieve Resume
           │
           ├─→ Record View Event
           │
           └─→ Update View Count
           │
           ▼
┌──────────────────────┐
│ Display Resume       │
│ (Public Viewer)      │
└──────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **UI Library**: Tailwind CSS
- **Charts**: Chart.js or Recharts
- **HTTP Client**: Fetch API / Axios

### Backend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull
- **PDF Generation**: Puppeteer
- **AI Integration**: OpenAI API
- **File Storage**: AWS S3

### DevOps
- **Deployment**: Vercel / Docker
- **Monitoring**: Sentry / DataDog
- **Logging**: Winston / Pino
- **Testing**: Jest / Vitest

---

## Security Architecture

### Authentication & Authorization

```
┌──────────────────┐
│  User Login      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  JWT Token       │
│  Generation      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  API Request     │
│  (with JWT)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Middleware      │
│  (Verify JWT)    │
└────────┬─────────┘
         │
         ├─→ Valid
         │   │
         │   ▼
         │  ┌──────────────────┐
         │  │ Check Ownership  │
         │  │ (resumeId)       │
         │  └────────┬─────────┘
         │           │
         │           ├─→ Owner
         │           │   │
         │           │   ▼
         │           │  ┌──────────────────┐
         │           │  │ Process Request  │
         │           │  └──────────────────┘
         │           │
         │           └─→ Not Owner
         │               │
         │               ▼
         │              ┌──────────────────┐
         │              │ Return 403       │
         │              │ Forbidden        │
         │              └──────────────────┘
         │
         └─→ Invalid
             │
             ▼
            ┌──────────────────┐
            │ Return 401       │
            │ Unauthorized     │
            └──────────────────┘
```

### Rate Limiting

```typescript
// Rate limiting middleware
const rateLimitMiddleware = async (req, res, next) => {
  const userId = req.user.id;
  const endpoint = req.path;
  const key = `ratelimit:${userId}:${endpoint}`;
  
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SIZE);
  }
  
  if (count > LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  next();
};
```

### Input Validation

```typescript
// Validation middleware
const validateInput = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.validate(req.body);
      req.body = validated;
      next();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
};
```

---

## Performance Optimization

### Caching Strategy

```
┌─────────────────────────────────────────┐
│  Request                                │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Check Cache    │
        │ (Redis)        │
        └────────┬───────┘
                 │
         ┌───────┴────────┐
         │                │
      Cache Hit        Cache Miss
         │                │
         ▼                ▼
    ┌─────────┐    ┌──────────────┐
    │ Return  │    │ Query DB     │
    │ Cached  │    │ (Expensive)  │
    │ Data    │    └──────┬───────┘
    └─────────┘           │
                          ▼
                    ┌──────────────┐
                    │ Store in     │
                    │ Cache (24h)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Return Data  │
                    └──────────────┘
```

### Database Query Optimization

1. **Use Indexes**: All frequently queried columns are indexed
2. **Pagination**: Limit result sets with LIMIT/OFFSET
3. **Projection**: Select only needed columns
4. **Aggregation**: Use database aggregation functions
5. **Connection Pooling**: Reuse database connections

### PDF Generation Optimization

```typescript
// Puppeteer pool for concurrent PDF generation
const puppeteerPool = new PuppeteerPool({
  max: 5, // Max 5 concurrent instances
  min: 1,
  idleTimeoutMillis: 30000,
});

// Timeout per PDF
const timeout = 30000; // 30 seconds

// Caching
const cacheKey = `pdf:${resumeId}:${template}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

---

## Error Handling

### Error Hierarchy

```
┌─────────────────────────────────┐
│  Error                          │
├─────────────────────────────────┤
│ ├─ ValidationError              │
│ ├─ AuthenticationError          │
│ ├─ AuthorizationError           │
│ ├─ NotFoundError                │
│ ├─ ConflictError                │
│ ├─ RateLimitError               │
│ ├─ ExternalServiceError         │
│ │  ├─ OpenAIError               │
│ │  ├─ S3Error                   │
│ │  └─ PuppeteerError            │
│ └─ InternalServerError          │
└─────────────────────────────────┘
```

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "field": "Additional context"
    },
    "requestId": "req_123abc"
  }
}
```

---

## Monitoring and Observability

### Key Metrics

1. **API Metrics**:
   - Request count
   - Response time (p50, p95, p99)
   - Error rate
   - Rate limit violations

2. **Service Metrics**:
   - PDF generation time
   - AI suggestion generation time
   - Analytics query time
   - Cache hit rate

3. **Database Metrics**:
   - Query execution time
   - Connection pool usage
   - Slow query log
   - Index usage

4. **External Service Metrics**:
   - OpenAI API latency
   - S3 upload/download time
   - Redis latency

### Logging

```typescript
// Structured logging
logger.info('PDF export started', {
  resumeId: 'resume_123',
  template: 'Modern',
  userId: 'user_456',
  timestamp: new Date().toISOString(),
});

logger.error('PDF generation failed', {
  resumeId: 'resume_123',
  error: error.message,
  stack: error.stack,
  requestId: req.id,
});
```

---

## Deployment Architecture

### Environment Configuration

```
Development
├─ Local PostgreSQL
├─ Local Redis
├─ Mock OpenAI API
└─ Local S3 (MinIO)

Staging
├─ RDS PostgreSQL
├─ ElastiCache Redis
├─ OpenAI API (test key)
└─ S3 (staging bucket)

Production
├─ RDS PostgreSQL (Multi-AZ)
├─ ElastiCache Redis (Cluster)
├─ OpenAI API (production key)
└─ S3 (production bucket)
```

### Scaling Considerations

1. **Horizontal Scaling**:
   - Multiple API instances behind load balancer
   - Database read replicas for analytics queries
   - Redis cluster for distributed caching

2. **Vertical Scaling**:
   - Increase Puppeteer pool size for PDF generation
   - Increase database connection pool
   - Increase Redis memory

3. **Auto-scaling**:
   - Scale API instances based on CPU/memory
   - Scale database based on connections
   - Scale queue workers based on queue depth


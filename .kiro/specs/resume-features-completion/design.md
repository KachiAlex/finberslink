# Resume Features Completion - Design Document

## Overview

The Resume Features Completion feature extends the Finbers Link resume management system with four major capability areas:

1. **PDF Export System** - Generate professional PDFs with multiple template styles (Modern, Classic, Minimal)
2. **AI Optimization Engine** - Provide intelligent suggestions for resume improvement with user approval workflow
3. **Analytics Platform** - Track resume engagement metrics including views, downloads, shares, and section engagement
4. **Publishing System** - Enable public resume profiles for employer discovery with visibility controls

This design integrates with the existing resume builder, user authentication, and database infrastructure while introducing new services for PDF generation, AI analysis, and analytics tracking.

## Architecture

### System Components

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

### Technology Stack

- **PDF Generation**: Puppeteer (headless browser) for HTML-to-PDF conversion with template support
- **AI Integration**: OpenAI API (GPT-4) for resume analysis and suggestions
- **Analytics**: PostgreSQL with optimized indexes for event tracking and aggregation
- **Caching**: Redis for frequently accessed analytics data and PDF cache
- **Event Processing**: Bull queue for async analytics event processing
- **Frontend**: React with TypeScript for UI components

## Components and Interfaces

### 1. PDF Export Service

#### Purpose
Generate professional PDF resumes with multiple template styles while preserving formatting and layout.

#### Key Responsibilities
- Render resume data using template-specific HTML/CSS
- Convert HTML to PDF using Puppeteer
- Cache generated PDFs for repeated exports
- Track export events for analytics
- Handle multi-page pagination

#### API Endpoint
```
POST /api/resume/export
Request:
{
  resumeId: string
  template: 'Modern' | 'Classic' | 'Minimal'
  includeHeadshot?: boolean
}

Response:
{
  downloadUrl: string
  fileName: string
  fileSize: number
  generatedAt: ISO8601
}
```

#### Template Specifications

**Modern Template**
- Contemporary design with accent colors
- Sidebar layout with skills and contact info
- Modern typography (Inter, Poppins)
- Color scheme: Primary accent with neutral backgrounds

**Classic Template**
- Traditional resume format
- Top-aligned header with contact info
- Conservative typography (Calibri, Arial)
- Black and white with subtle gray accents

**Minimal Template**
- Clean, simple layout
- Centered header
- Minimal typography (Helvetica, Roboto)
- Pure black and white

### 2. AI Optimization Service

#### Purpose
Analyze resume content and provide intelligent suggestions for improvement using AI.

#### Key Responsibilities
- Analyze resume content against best practices
- Generate suggestions for summary, achievements, skills, and experience
- Store suggestions with versioning
- Manage approval workflow
- Create version snapshots before applying changes

#### API Endpoints
```
POST /api/resume/ai/suggestions
Request:
{
  resumeId: string
  analysisType?: 'full' | 'summary' | 'achievements' | 'skills'
}

Response:
{
  suggestions: Suggestion[]
  analysisMetadata: {
    completedAt: ISO8601
    modelUsed: string
    tokensUsed: number
  }
}

POST /api/resume/ai/suggestions/approve
Request:
{
  resumeId: string
  suggestionIds: string[]
}

Response:
{
  appliedCount: number
  versionId: string
  resumeUpdated: boolean
}

POST /api/resume/ai/suggestions/reject
Request:
{
  resumeId: string
  suggestionIds: string[]
}

Response:
{
  rejectedCount: number
}
```

#### Suggestion Structure
```typescript
interface Suggestion {
  id: string
  resumeId: string
  category: 'summary' | 'achievement' | 'skill' | 'experience'
  originalText: string
  suggestedText: string
  explanation: string
  confidenceLevel: 'high' | 'medium' | 'low'
  targetField: string // e.g., "summary", "experience[0].achievements[1]"
  status: 'pending' | 'approved' | 'rejected'
  createdAt: ISO8601
}
```

### 3. Analytics Service

#### Purpose
Track and report on resume engagement metrics including views, downloads, shares, and section engagement.

#### Key Responsibilities
- Record view, download, and share events
- Track section engagement (time spent, scroll depth)
- Calculate engagement metrics and trends
- Provide analytics dashboard data
- Support date range filtering and comparisons
- Generate analytics reports

#### API Endpoints
```
GET /api/resume/analytics/:resumeId
Query Parameters:
  - startDate?: ISO8601
  - endDate?: ISO8601
  - groupBy?: 'day' | 'week' | 'month'

Response:
{
  summary: {
    totalViews: number
    totalDownloads: number
    totalShares: number
    uniqueViewers: number
    viewToDownloadRatio: number
    shareToViewRatio: number
  }
  trends: {
    views: TrendPoint[]
    downloads: TrendPoint[]
    shares: TrendPoint[]
  }
  sectionEngagement: SectionEngagement[]
  viewHistory: ViewRecord[]
  recentViewers: ViewerInfo[]
}

POST /api/resume/analytics/events
Request:
{
  resumeId: string
  eventType: 'view' | 'download' | 'share'
  metadata: {
    deviceType?: string
    browser?: string
    operatingSystem?: string
    country?: string
    city?: string
    shareMethod?: string
    sectionEngagement?: SectionEngagementData[]
  }
}

Response:
{
  eventId: string
  recorded: boolean
}

GET /api/resume/analytics/export
Query Parameters:
  - resumeId: string
  - format: 'csv' | 'pdf'
  - startDate?: ISO8601
  - endDate?: ISO8601

Response:
{
  downloadUrl: string
  fileName: string
}
```

#### Analytics Data Structures
```typescript
interface TrendPoint {
  date: ISO8601
  value: number
  change: number // percentage change from previous period
}

interface SectionEngagement {
  sectionName: string
  viewCount: number
  timeSpentSeconds: number
  scrollDepth: number // 0-100 percentage
  engagementPercentage: number // of total view time
  rank: number
}

interface ViewRecord {
  id: string
  timestamp: ISO8601
  deviceType?: string
  browser?: string
  operatingSystem?: string
  country?: string
  city?: string
  timeSpentSeconds?: number
  viewerEmail?: string
}

interface ViewerInfo {
  viewerEmail?: string
  viewerName?: string
  lastViewedAt: ISO8601
  viewCount: number
  deviceType?: string
  country?: string
}
```

### 4. Publishing Service

#### Purpose
Enable users to publish resumes to a public profile for employer discovery.

#### Key Responsibilities
- Generate unique public URLs for resumes
- Manage publication status and visibility
- Add/remove resumes from discovery index
- Track public resume access
- Provide public resume viewer

#### API Endpoints
```
POST /api/resume/publish
Request:
{
  resumeId: string
  publish: boolean
}

Response:
{
  published: boolean
  publicUrl: string
  publicId: string
  publishedAt?: ISO8601
}

GET /api/resume/publish-status/:resumeId
Response:
{
  published: boolean
  publicUrl?: string
  publishedAt?: ISO8601
  viewCount: number
}

GET /public/resumes/:publicId
Response:
{
  resume: ResumeData
  publisherName: string
  publishedAt: ISO8601
  viewCount: number
}

GET /api/resume/discovery/search
Query Parameters:
  - q?: string (search query)
  - skills?: string[] (filter by skills)
  - roles?: string[] (filter by target roles)
  - industries?: string[] (filter by industries)
  - limit?: number
  - offset?: number

Response:
{
  results: PublishedResumePreview[]
  total: number
}
```

## Data Models

### Database Schema Extensions

#### ResumeAnalytics (New)
```sql
CREATE TABLE ResumeAnalytics (
  id SERIAL PRIMARY KEY,
  resumeId VARCHAR(255) NOT NULL,
  eventType VARCHAR(50) NOT NULL, -- 'view', 'download', 'share'
  deviceType VARCHAR(50),
  browser VARCHAR(100),
  operatingSystem VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  shareMethod VARCHAR(50),
  timeSpentSeconds INT,
  scrollDepth INT,
  sectionName VARCHAR(255),
  viewerEmail VARCHAR(255),
  viewerName VARCHAR(255),
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resumeId) REFERENCES Resume(id) ON DELETE CASCADE,
  INDEX idx_resumeId_createdAt (resumeId, createdAt),
  INDEX idx_eventType_createdAt (eventType, createdAt),
  INDEX idx_country (country),
  INDEX idx_sectionName (sectionName)
);
```

#### ResumeSuggestion (New)
```sql
CREATE TABLE ResumeSuggestion (
  id SERIAL PRIMARY KEY,
  resumeId VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'summary', 'achievement', 'skill', 'experience'
  originalText TEXT NOT NULL,
  suggestedText TEXT NOT NULL,
  explanation TEXT,
  confidenceLevel VARCHAR(20), -- 'high', 'medium', 'low'
  targetField VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  appliedAt TIMESTAMP,
  FOREIGN KEY (resumeId) REFERENCES Resume(id) ON DELETE CASCADE,
  INDEX idx_resumeId_status (resumeId, status),
  INDEX idx_createdAt (createdAt)
);
```

#### ResumePublishing (New)
```sql
CREATE TABLE ResumePublishing (
  id SERIAL PRIMARY KEY,
  resumeId VARCHAR(255) NOT NULL UNIQUE,
  publicId VARCHAR(255) NOT NULL UNIQUE,
  published BOOLEAN DEFAULT FALSE,
  publishedAt TIMESTAMP,
  unpublishedAt TIMESTAMP,
  viewCount INT DEFAULT 0,
  lastViewedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (resumeId) REFERENCES Resume(id) ON DELETE CASCADE,
  INDEX idx_publicId (publicId),
  INDEX idx_published (published)
);
```

#### ResumeSectionEngagement (New)
```sql
CREATE TABLE ResumeSectionEngagement (
  id SERIAL PRIMARY KEY,
  resumeId VARCHAR(255) NOT NULL,
  sectionName VARCHAR(255) NOT NULL,
  viewCount INT DEFAULT 0,
  totalTimeSpentSeconds INT DEFAULT 0,
  averageScrollDepth INT DEFAULT 0,
  lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resumeId) REFERENCES Resume(id) ON DELETE CASCADE,
  UNIQUE KEY unique_resume_section (resumeId, sectionName),
  INDEX idx_resumeId (resumeId)
);
```

### Prisma Schema Updates

```prisma
model ResumeAnalytics {
  id                  String    @id @default(cuid())
  resumeId            String
  eventType           String    // 'view', 'download', 'share'
  deviceType          String?
  browser             String?
  operatingSystem     String?
  country             String?
  city                String?
  shareMethod         String?
  timeSpentSeconds    Int?
  scrollDepth         Int?
  sectionName         String?
  viewerEmail         String?
  viewerName          String?
  metadata            Json?
  createdAt           DateTime  @default(now())
  resume              Resume    @relation("Analytics", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@index([resumeId, createdAt])
  @@index([eventType, createdAt])
  @@index([country])
  @@index([sectionName])
}

model ResumeSuggestion {
  id                  String    @id @default(cuid())
  resumeId            String
  category            String    // 'summary', 'achievement', 'skill', 'experience'
  originalText        String
  suggestedText       String
  explanation         String?
  confidenceLevel     String    // 'high', 'medium', 'low'
  targetField         String?
  status              String    @default("pending") // 'pending', 'approved', 'rejected'
  createdAt           DateTime  @default(now())
  appliedAt           DateTime?
  resume              Resume    @relation("Suggestions", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@index([resumeId, status])
  @@index([createdAt])
}

model ResumePublishing {
  id                  String    @id @default(cuid())
  resumeId            String    @unique
  publicId            String    @unique
  published           Boolean   @default(false)
  publishedAt         DateTime?
  unpublishedAt       DateTime?
  viewCount           Int       @default(0)
  lastViewedAt        DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  resume              Resume    @relation("Publishing", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@index([publicId])
  @@index([published])
}

model ResumeSectionEngagement {
  id                  String    @id @default(cuid())
  resumeId            String
  sectionName         String
  viewCount           Int       @default(0)
  totalTimeSpentSeconds Int     @default(0)
  averageScrollDepth  Int       @default(0)
  lastUpdatedAt       DateTime  @default(now())
  resume              Resume    @relation("SectionEngagement", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@unique([resumeId, sectionName])
  @@index([resumeId])
}

// Update Resume model to include new relations
model Resume {
  // ... existing fields ...
  analytics           ResumeAnalytics[]     @relation("Analytics")
  suggestions         ResumeSuggestion[]    @relation("Suggestions")
  publishing          ResumePublishing?     @relation("Publishing")
  sectionEngagement   ResumeSectionEngagement[] @relation("SectionEngagement")
}
```

## Error Handling

### PDF Export Errors
- **Invalid Resume Data**: Return 400 with message "Resume data is incomplete or invalid"
- **Template Not Found**: Return 400 with message "Selected template is not available"
- **PDF Generation Timeout**: Return 504 with message "PDF generation took too long, please try again"
- **File Size Exceeded**: Return 413 with message "Generated PDF exceeds maximum file size"

### AI Service Errors
- **API Rate Limit**: Return 429 with message "Too many requests, please try again later"
- **AI Service Unavailable**: Return 503 with message "AI service is temporarily unavailable"
- **Invalid Resume Content**: Return 400 with message "Resume content is not suitable for analysis"
- **Insufficient Content**: Return 400 with message "Resume needs more content for meaningful suggestions"

### Analytics Errors
- **Event Recording Failed**: Log error, return 500 with message "Failed to record event"
- **Data Retrieval Failed**: Return 500 with message "Failed to retrieve analytics data"
- **Invalid Date Range**: Return 400 with message "Invalid date range specified"

### Publishing Errors
- **Resume Already Published**: Return 409 with message "Resume is already published"
- **Invalid Public URL**: Return 400 with message "Failed to generate public URL"
- **Access Denied**: Return 403 with message "You don't have permission to publish this resume"

## Testing Strategy

### Unit Tests

**PDF Export Service**
- Test PDF generation with valid resume data
- Test filename generation with various user names
- Test template selection and application
- Test error handling for invalid data
- Test caching mechanism

**AI Service**
- Test suggestion generation with mocked OpenAI API
- Test suggestion approval and rejection
- Test version snapshot creation
- Test batch suggestion processing
- Test error handling for API failures

**Analytics Service**
- Test event recording with various metadata
- Test metric calculations (ratios, averages, trends)
- Test date range filtering
- Test aggregation logic
- Test section engagement ranking

**Publishing Service**
- Test public URL generation
- Test publication status management
- Test discovery index updates
- Test access control for public resumes

### Integration Tests

**PDF Export Workflow**
- Test end-to-end PDF export with database persistence
- Test export history tracking
- Test template preview functionality

**AI Suggestion Workflow**
- Test full suggestion generation and approval flow
- Test version history creation
- Test resume update after suggestion approval

**Analytics Workflow**
- Test view tracking on public resume access
- Test analytics dashboard data retrieval
- Test report generation and export

**Publishing Workflow**
- Test resume publication and unpublication
- Test public resume access without authentication
- Test discovery index search functionality

### Property-Based Tests

**PDF Generation Properties**
- For any valid resume data, the generated PDF should contain all sections
- For any user name, the filename should follow the format `{firstName}_{lastName}_Resume.pdf`
- For any multi-page resume, pagination should maintain consistent formatting

**Analytics Properties**
- For any analytics event, it should be persisted with correct timestamp and metadata
- For any date range, filtering should return only events within that range
- For any set of views, the view count should equal the number of recorded view events
- For any section engagement data, percentages should sum to 100%
- For any two time periods, comparison metrics should be calculated correctly

**Publishing Properties**
- For any published resume, a unique public URL should be generated in the format `/public/resumes/{publicId}`
- For any unpublished resume, it should be removed from the discovery index
- For any public resume access, a view event should be recorded

**Suggestion Properties**
- For any approved suggestion, the suggested text should replace the original text in the resume
- For any rejected suggestion, the resume should remain unchanged
- For any batch of suggestions, a single version snapshot should be created

### Performance Tests

- PDF generation should complete within 5 seconds for typical resumes
- Analytics queries should return results within 500ms for date ranges up to 1 year
- AI suggestion generation should complete within 30 seconds
- Public resume page should load within 2 seconds

### Security Tests

- Verify user ownership before allowing PDF export
- Verify user ownership before allowing resume publication
- Verify public resume access doesn't require authentication
- Verify analytics data is properly scoped to resume owner
- Verify rate limiting on AI suggestion requests (max 10 per hour per user)

## Implementation Timeline and Dependencies

### Phase 1: PDF Export System (Weeks 1-2)
- Set up Puppeteer for PDF generation
- Create template HTML/CSS files
- Implement PDF export API endpoint
- Add export tracking to analytics
- Create export dialog UI component

**Dependencies**: None (can start immediately)

### Phase 2: Analytics Foundation (Weeks 2-3)
- Create analytics database schema
- Implement event recording API
- Set up event queue for async processing
- Create analytics aggregation service
- Implement basic analytics dashboard

**Dependencies**: Phase 1 (for export event tracking)

### Phase 3: AI Optimization (Weeks 3-4)
- Integrate OpenAI API
- Create suggestion generation service
- Implement suggestion approval workflow
- Create version snapshot system
- Build suggestion review UI

**Dependencies**: Phase 2 (for version tracking)

### Phase 4: Publishing System (Weeks 4-5)
- Create publishing database schema
- Implement publication API endpoints
- Build public resume viewer
- Create discovery index
- Implement search functionality

**Dependencies**: Phase 2 (for view tracking)

### Phase 5: Advanced Analytics (Weeks 5-6)
- Implement section engagement tracking
- Create analytics dashboard with charts
- Add report generation and export
- Implement date range filtering
- Add comparison metrics

**Dependencies**: Phase 2 (analytics foundation)

### Phase 6: Testing and Optimization (Weeks 6-7)
- Write comprehensive test suites
- Performance optimization
- Security hardening
- Documentation
- Deployment preparation

**Dependencies**: All previous phases

## Performance and Scalability Considerations

### PDF Generation
- Cache generated PDFs for 24 hours to reduce regeneration
- Use Puppeteer pool with max 5 concurrent instances
- Implement timeout of 30 seconds per PDF
- Store PDFs in S3 with CloudFront CDN

### Analytics
- Use Redis for real-time metric caching
- Batch analytics events in queue (process every 5 seconds)
- Archive analytics data older than 1 year to separate table
- Create indexes on frequently queried columns (resumeId, createdAt, eventType)
- Use materialized views for common aggregations

### AI Service
- Implement request queuing with max 10 concurrent requests
- Cache suggestions for 24 hours
- Rate limit to 10 requests per user per hour
- Use streaming for long-running analyses

### Database
- Add composite indexes for common query patterns
- Partition analytics table by date (monthly)
- Use connection pooling with max 20 connections
- Implement query result caching with Redis

## Security and Privacy Considerations

### Authentication & Authorization
- Verify user ownership before allowing export, publication, or analytics access
- Use JWT tokens for public resume access (no authentication required)
- Implement role-based access control for admin analytics

### Data Privacy
- Anonymize viewer information in analytics (no IP addresses stored)
- Implement GDPR compliance for analytics data retention
- Allow users to delete analytics data on demand
- Encrypt sensitive data in transit and at rest

### Rate Limiting
- Limit PDF exports to 50 per day per user
- Limit AI suggestions to 10 per hour per user
- Limit analytics queries to 100 per minute per user
- Implement IP-based rate limiting for public resume access

### Input Validation
- Validate all resume data before PDF generation
- Sanitize user input in analytics metadata
- Validate date ranges in analytics queries
- Implement CSRF protection for state-changing operations

### API Security
- Use HTTPS for all API endpoints
- Implement request signing for sensitive operations
- Add API key authentication for external integrations
- Log all API access for audit trails

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: PDF Generation Completeness

For any valid resume data with all sections populated, the generated PDF should contain all resume sections (summary, experience, education, projects, skills) with no missing content.

**Validates: Requirements 1.2, 1.4**

### Property 2: Filename Format Consistency

For any user with firstName and lastName, the exported PDF filename should follow the exact format `{firstName}_{lastName}_Resume.pdf` with proper URL encoding for special characters.

**Validates: Requirements 1.6**

### Property 3: Multi-page Pagination Consistency

For any resume spanning multiple pages, the PDF formatting should remain consistent across all pages with proper page breaks and header/footer preservation.

**Validates: Requirements 1.5, 8.5**

### Property 4: Export Event Persistence

For any PDF export operation, an export event should be recorded in the database with correct timestamp, template metadata, and user information.

**Validates: Requirements 1.8**

### Property 5: Suggestion Application Correctness

For any approved suggestion, the suggested text should replace the original text in the resume at the specified target field, and the resume should reflect this change immediately.

**Validates: Requirements 2.6, 9.3**

### Property 6: Suggestion Rejection Preservation

For any rejected suggestion, the resume content should remain completely unchanged, with no modifications applied.

**Validates: Requirements 2.7, 9.4**

### Property 7: Version Snapshot Creation

For any batch of suggestions applied to a resume, exactly one version snapshot should be created before applying the changes, capturing the complete resume state before modification.

**Validates: Requirements 2.8, 9.5, 9.6**

### Property 8: View Count Accuracy

For any resume, the total view count should equal the number of recorded view events in the analytics table for that resume.

**Validates: Requirements 3.1, 5.1**

### Property 9: Analytics Metric Calculations

For any set of analytics events, calculated metrics (view-to-download ratio, share-to-view ratio, engagement percentages) should be mathematically correct and consistent.

**Validates: Requirements 3.2, 7.4, 10.3**

### Property 10: Section Engagement Ranking

For any resume with section engagement data, sections should be ranked by engagement level (most to least engaged) based on time spent and view count.

**Validates: Requirements 6.5**

### Property 11: Date Range Filtering

For any date range query on analytics data, only events with timestamps within the specified range (inclusive) should be returned.

**Validates: Requirements 3.7, 5.5, 7.7**

### Property 12: View History Chronological Order

For any view history query, views should be returned in reverse chronological order (most recent first) with correct timestamps.

**Validates: Requirements 5.3, 5.4**

### Property 13: Unique Viewer Aggregation

For any resume with multiple views from the same viewer, the unique viewer count should reflect the number of distinct viewers, not total views.

**Validates: Requirements 5.6, 5.7**

### Property 14: Average Calculation Accuracy

For any time period with view events, the calculated average views per day should equal total views divided by number of days in the period.

**Validates: Requirements 5.8, 10.3**

### Property 15: Public URL Generation

For any published resume, a unique public URL should be generated in the format `/public/resumes/{publicId}` where publicId is a unique identifier.

**Validates: Requirements 4.2**

### Property 16: Publication Status Consistency

For any resume, the publication status (published/unpublished) should be consistent across all queries, and unpublished resumes should not be accessible via public URL.

**Validates: Requirements 4.5, 4.8**

### Property 17: Public Resume Access Tracking

For any access to a published resume via public URL, a view event should be recorded with correct timestamp and available metadata.

**Validates: Requirements 4.7, 5.1**

### Property 18: Analytics Data Retention

For any deleted resume, analytics data should be retained in the database for exactly 90 days before permanent deletion.

**Validates: Requirements 10.8**

### Property 19: Version-Specific Analytics

For any resume with multiple versions, analytics events should be tracked separately for each version, allowing historical analysis of engagement per version.

**Validates: Requirements 10.6**

### Property 20: Report Generation Accuracy

For any analytics export request, the generated report should contain all analytics data for the specified date range with correct calculations and formatting.

**Validates: Requirements 10.4**


# Resume Completion Feature - Design Document

## Overview

The Resume Completion Feature extends the existing resume management system with comprehensive PDF export, advanced sharing capabilities, version control, analytics, and notifications. This design provides a scalable architecture for handling PDF generation, email-based sharing with time-limited links, automatic versioning, detailed analytics tracking, and real-time notifications. The implementation integrates with existing resume infrastructure while introducing new services for PDF generation, sharing management, versioning, analytics, and notifications.

## Architecture

### System Components

The feature introduces five new microservices alongside the existing resume system:

1. **PDF Generation Service** - Converts resume data to PDF with multiple templates
2. **Sharing Service** - Manages share links, expiration, and access control
3. **Versioning Service** - Tracks resume changes and enables restoration
4. **Analytics Service** - Records and aggregates view/engagement data
5. **Notification Service** - Sends notifications for resume activity

### Integration Points

- **Resume API** - Existing endpoints extended with export/sharing capabilities
- **Email Service** - Sends share invitations and activity notifications
- **Authentication** - Share links bypass auth; analytics tracks anonymous viewers
- **Database** - New tables for shares, versions, exports, analytics, notifications
- **File Storage** - Stores generated PDFs and archived versions

### Data Flow

```
User Action → Service Handler → Database → Response
     ↓
  Analytics Service (async)
     ↓
  Notification Service (async)
```

## Components and Interfaces

### PDF Generation Service

**Responsibilities:**
- Convert resume data to PDF with template selection
- Embed fonts and optimize file size
- Preserve formatting, links, and images
- Generate ATS-optimized plain text exports
- Track export history

**Key Methods:**
```typescript
generatePDF(resumeId: string, template: 'Modern' | 'Classic' | 'Minimal', options: ExportOptions): Promise<Buffer>
generateATSExport(resumeId: string): Promise<string>
recordExport(resumeId: string, metadata: ExportMetadata): Promise<void>
getExportHistory(resumeId: string, filters?: HistoryFilters): Promise<ExportRecord[]>
```

**Template Specifications:**
- **Modern**: Contemporary layout with accent colors, sidebar skills
- **Classic**: Traditional format with clear hierarchy
- **Minimal**: Clean, ATS-friendly layout with minimal formatting

### Sharing Service

**Responsibilities:**
- Generate unique share tokens
- Create and manage share links
- Handle expiration logic
- Support link extension and revocation
- Track share metadata

**Key Methods:**
```typescript
createShareLink(resumeId: string, recipients: string[], expirationDays?: number): Promise<ShareLink[]>
getShareLinks(resumeId: string): Promise<ShareLink[]>
extendExpiration(shareToken: string, additionalDays: number): Promise<void>
revokeShareLink(shareToken: string): Promise<void>
validateShareToken(shareToken: string): Promise<boolean>
```

**Share Link Structure:**
```
/resumes/{resumeId}/view/{shareToken}
```

### Versioning Service

**Responsibilities:**
- Automatically snapshot resume on updates
- Store complete version history
- Enable version restoration
- Archive old versions (keep 50 most recent)
- Retain deleted resume versions for 90 days

**Key Methods:**
```typescript
createVersion(resumeId: string, changeDescription?: string): Promise<Version>
getVersionHistory(resumeId: string): Promise<Version[]>
restoreVersion(resumeId: string, versionId: string): Promise<void>
archiveOldVersions(resumeId: string): Promise<void>
```

### Analytics Service

**Responsibilities:**
- Record view events with device/location metadata
- Track engagement metrics per section
- Calculate view/download/share ratios
- Aggregate data for performance (daily summaries after 10k records)
- Provide analytics dashboard data

**Key Methods:**
```typescript
recordView(shareToken: string, metadata: ViewMetadata): Promise<void>
recordDownload(exportId: string): Promise<void>
getAnalytics(resumeId: string): Promise<AnalyticsData>
getRecentViewers(resumeId: string, limit?: number): Promise<Viewer[]>
```

### Notification Service

**Responsibilities:**
- Create notifications for views and downloads
- Send email notifications (if enabled)
- Aggregate multiple views from same viewer
- Provide notification history
- Support notification preferences

**Key Methods:**
```typescript
createNotification(resumeId: string, type: 'view' | 'download', metadata: NotificationMetadata): Promise<void>
sendNotificationEmail(userId: string, notification: Notification): Promise<void>
getNotifications(userId: string): Promise<Notification[]>
updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>
```

## Data Models

### New Prisma Models

**ResumeShareLink**
```prisma
model ResumeShareLink {
  id                String    @id @default(cuid())
  resumeId          String
  shareToken        String    @unique
  recipientEmail    String?
  senderId          String
  createdAt         DateTime  @default(now())
  expiresAt         DateTime
  revokedAt         DateTime?
  viewCount         Int       @default(0)
  lastViewedAt      DateTime?
  resume            Resume    @relation(fields: [resumeId], references: [id])
  sender            User      @relation(fields: [senderId], references: [id])
  
  @@index([resumeId])
  @@index([shareToken])
  @@index([expiresAt])
}
```

**ResumeVersion**
```prisma
model ResumeVersion {
  id                String    @id @default(cuid())
  resumeId          String
  versionNumber     Int
  data              Json      // Complete resume snapshot
  changeDescription String?
  createdAt         DateTime  @default(now())
  createdBy         String
  archivedAt        DateTime?
  resume            Resume    @relation(fields: [resumeId], references: [id])
  
  @@index([resumeId])
  @@index([createdAt])
}
```

**ResumeExport**
```prisma
model ResumeExport {
  id                String    @id @default(cuid())
  resumeId          String
  template          String    // 'Modern', 'Classic', 'Minimal', 'ATS'
  fileSize          Int
  downloadCount     Int       @default(0)
  userAgent         String?
  ipAddress         String?
  createdAt         DateTime  @default(now())
  resume            Resume    @relation(fields: [resumeId], references: [id])
  
  @@index([resumeId])
  @@index([createdAt])
}
```

**ResumeView**
```prisma
model ResumeView {
  id                String    @id @default(cuid())
  resumeId          String
  shareToken        String
  deviceType        String?   // 'mobile', 'tablet', 'desktop'
  browser           String?
  operatingSystem   String?
  country           String?
  city              String?
  viewerEmail       String?
  timeSpentSeconds  Int?
  createdAt         DateTime  @default(now())
  resume            Resume    @relation(fields: [resumeId], references: [id])
  
  @@index([resumeId])
  @@index([shareToken])
  @@index([createdAt])
}
```

**ResumeNotification**
```prisma
model ResumeNotification {
  id                String    @id @default(cuid())
  userId            String
  resumeId          String
  type              String    // 'view', 'download'
  viewerEmail       String?
  viewerName        String?
  aggregatedCount   Int       @default(1)
  isRead            Boolean   @default(false)
  emailSent         Boolean   @default(false)
  createdAt         DateTime  @default(now())
  user              User      @relation(fields: [userId], references: [id])
  resume            Resume    @relation(fields: [resumeId], references: [id])
  
  @@index([userId])
  @@index([resumeId])
  @@index([createdAt])
}
```

**NotificationPreference**
```prisma
model NotificationPreference {
  id                String    @id @default(cuid())
  userId            String    @unique
  viewNotifications Boolean   @default(true)
  downloadNotifications Boolean @default(true)
  emailNotifications Boolean   @default(true)
  aggregateViews    Boolean   @default(true)
  updatedAt         DateTime  @updatedAt
  user              User      @relation(fields: [userId], references: [id])
}
```

### Resume Model Updates

Add to existing Resume model:
```prisma
shareLinks        ResumeShareLink[]
versions          ResumeVersion[]
exports           ResumeExport[]
views             ResumeView[]
notifications     ResumeNotification[]
```

## API Endpoints

### PDF Export Endpoints

**POST /api/resumes/{resumeId}/export**
- Request: `{ template: string, includePhoto?: boolean, format?: 'pdf' | 'ats' }`
- Response: `{ downloadUrl: string, filename: string, fileSize: number }`
- Records export in history

**GET /api/resumes/{resumeId}/export-history**
- Query: `{ dateFrom?: string, dateTo?: string, template?: string, limit?: number }`
- Response: `{ exports: ExportRecord[], total: number, statistics: ExportStatistics }`

**GET /api/resumes/{resumeId}/export-statistics**
- Response: `{ totalExports: number, mostUsedTemplate: string, exportFrequency: object }`

### Sharing Endpoints

**POST /api/resumes/{resumeId}/share**
- Request: `{ recipients: string[], expirationDays?: number, message?: string }`
- Response: `{ shareLinks: ShareLink[], emailsSent: number }`

**GET /api/resumes/{resumeId}/share-links**
- Response: `{ shareLinks: ShareLink[], summary: ShareSummary }`

**PATCH /api/share-links/{shareToken}/extend**
- Request: `{ additionalDays: number }`
- Response: `{ newExpiresAt: string }`

**DELETE /api/share-links/{shareToken}**
- Response: `{ success: boolean }`

**GET /api/resumes/{resumeId}/view/{shareToken}**
- Public endpoint (no auth required)
- Records view analytics
- Response: Resume data for display

### Versioning Endpoints

**GET /api/resumes/{resumeId}/versions**
- Response: `{ versions: Version[], total: number }`

**POST /api/resumes/{resumeId}/versions/{versionId}/restore**
- Request: `{ changeDescription?: string }`
- Response: `{ success: boolean, newVersionId: string }`

### Analytics Endpoints

**GET /api/resumes/{resumeId}/analytics**
- Response: `{ totalViews: number, uniqueViewers: number, recentViewers: Viewer[], metrics: AnalyticsMetrics }`

**GET /api/resumes/{resumeId}/analytics/viewers**
- Query: `{ limit?: number, offset?: number }`
- Response: `{ viewers: DetailedViewer[], total: number }`

### Notification Endpoints

**GET /api/notifications**
- Query: `{ limit?: number, offset?: number }`
- Response: `{ notifications: Notification[], unreadCount: number }`

**PATCH /api/notifications/{notificationId}/read**
- Response: `{ success: boolean }`

**PATCH /api/notifications/preferences**
- Request: `{ viewNotifications?: boolean, downloadNotifications?: boolean, emailNotifications?: boolean }`
- Response: `{ preferences: NotificationPreference }`

## Error Handling

### PDF Generation Errors
- Invalid resume data → 400 Bad Request with specific field errors
- Template not found → 400 Bad Request
- File size exceeds limit → 413 Payload Too Large
- Generation timeout → 504 Gateway Timeout with retry guidance

### Sharing Errors
- Invalid email format → 400 Bad Request
- Share link expired → 403 Forbidden with expiration timestamp
- Share link revoked → 403 Forbidden
- Too many recipients → 400 Bad Request (limit: 50 per request)

### Versioning Errors
- Version not found → 404 Not Found
- Resume locked during restoration → 409 Conflict
- Restoration failed → 500 Internal Server Error with rollback

### Analytics Errors
- Invalid share token → 404 Not Found
- Analytics data corrupted → 500 Internal Server Error with fallback

### Notification Errors
- User not found → 404 Not Found
- Email service unavailable → 503 Service Unavailable with retry

## Performance Considerations

### Caching Strategy
- Cache export history for 1 hour (invalidate on new export)
- Cache analytics summaries for 30 minutes (real-time for last 24 hours)
- Cache share link validation for 5 minutes
- Cache version history for 1 hour

### Database Optimization
- Index on `resumeId` for all new tables
- Index on `shareToken` for fast validation
- Index on `createdAt` for time-based queries
- Composite index on `(resumeId, createdAt)` for history queries

### Async Processing
- Export recording happens asynchronously
- Analytics aggregation runs nightly for records older than 30 days
- Notification emails sent via queue (not blocking)
- Version archival runs weekly

### File Storage
- PDFs stored in cloud storage (S3/GCS) with 30-day retention
- Archived versions stored separately with 90-day retention
- Implement cleanup jobs for expired share links

### Rate Limiting
- Export: 10 per hour per user
- Share creation: 50 per hour per user
- Analytics queries: 100 per hour per user
- View recording: 1000 per hour per resume

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: PDF Export Completeness

*For any* resume with valid data and selected template, the generated PDF SHALL contain all non-empty resume sections (summary, experience, education, projects, skills) in the correct order.

**Validates: Requirements 1.1, 1.5**

### Property 2: Template Rendering Consistency

*For any* resume exported with different templates, each template SHALL produce visually distinct output with template-specific formatting applied consistently.

**Validates: Requirements 1.2, 7.2**

### Property 3: Share Token Uniqueness

*For any* set of share link creations, all generated share tokens SHALL be unique and cryptographically secure, preventing token collision or prediction.

**Validates: Requirements 2.2**

### Property 4: Share Link Format Compliance

*For any* generated share link, the URL SHALL follow the format `/resumes/{resumeId}/view/{shareToken}` with valid resumeId and shareToken components.

**Validates: Requirements 2.3**

### Property 5: Expiration Enforcement

*For any* share link that has passed its expiration timestamp, accessing the link SHALL return a 403 Forbidden error and prevent resume access.

**Validates: Requirements 3.3, 3.4**

### Property 6: Expiration Calculation Accuracy

*For any* share link created with expiration duration, the calculated expiration timestamp SHALL be exactly the specified number of days from creation time.

**Validates: Requirements 3.2**

### Property 7: Default Expiration Application

*For any* share link created without explicit expiration configuration, the system SHALL apply a 30-day default expiration.

**Validates: Requirements 3.8**

### Property 8: Version Snapshot Completeness

*For any* resume update, a version snapshot SHALL be automatically created containing all resume sections and metadata from the pre-update state.

**Validates: Requirements 4.1, 4.2**

### Property 9: Version Restoration Accuracy

*For any* version restoration operation, the current resume data SHALL be replaced with the exact data from the selected version snapshot.

**Validates: Requirements 4.5**

### Property 10: Version History Ordering

*For any* resume with multiple versions, the version history SHALL be displayed in reverse chronological order (newest first) with accurate timestamps.

**Validates: Requirements 4.4**

### Property 11: Export History Recording

*For any* PDF export completion, an export record SHALL be created with accurate template, timestamp, and file size metadata.

**Validates: Requirements 5.1, 5.4**

### Property 12: Export History Ordering

*For any* resume with multiple exports, the export history SHALL be displayed in reverse chronological order with accurate timestamps.

**Validates: Requirements 5.3**

### Property 13: View Recording Accuracy

*For any* shared resume access, a view record SHALL be created with accurate timestamp and available device/location metadata.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 14: Analytics Metric Calculation

*For any* resume with recorded views, the analytics dashboard SHALL display accurate total view count, unique viewer count, and engagement metrics.

**Validates: Requirements 6.4, 6.7, 6.8**

### Property 15: PDF File Size Optimization

*For any* generated PDF, the file size SHALL be under 5MB regardless of resume content or template selection.

**Validates: Requirements 7.4**

### Property 16: ATS Export Format Compliance

*For any* ATS-optimized export, the output SHALL be plain text format with standard section headers (EXPERIENCE, EDUCATION, SKILLS, PROJECTS) and no formatting or images.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 17: ATS Content Preservation

*For any* ATS export, all resume text content, dates, and links SHALL be preserved without loss or modification.

**Validates: Requirements 9.4, 9.7**

### Property 18: Notification Creation on View

*For any* shared resume view, a notification SHALL be created for the resume owner with accurate viewer information and timestamp.

**Validates: Requirements 10.1**

### Property 19: Notification Aggregation

*For any* multiple views from the same viewer within an aggregation window, the notifications SHALL be combined into a single aggregated notification with accurate count.

**Validates: Requirements 10.5**

### Property 20: Share Link Revocation Enforcement

*For any* revoked share link, subsequent access attempts SHALL return a 403 Forbidden error and prevent resume access.

**Validates: Requirements 3.7**

## Testing Strategy

### Unit Tests

**PDF Generation Tests:**
- Test PDF generation with each template (Modern, Classic, Minimal)
- Test PDF generation with missing optional fields
- Test PDF generation with special characters and formatting
- Test ATS export format and content preservation
- Test filename generation with various user names
- Test file size optimization

**Sharing Tests:**
- Test share link creation with valid email addresses
- Test share link creation with multiple recipients
- Test share token uniqueness across multiple creations
- Test expiration timestamp calculation
- Test default 30-day expiration application
- Test share link revocation
- Test share link extension

**Versioning Tests:**
- Test automatic version creation on resume update
- Test version snapshot data completeness
- Test version restoration accuracy
- Test version history ordering
- Test version archival (50 version limit)

**Analytics Tests:**
- Test view recording with device metadata
- Test analytics metric calculations
- Test viewer list retrieval
- Test analytics aggregation

**Notification Tests:**
- Test notification creation on view/download
- Test notification aggregation
- Test notification preferences
- Test email notification sending

### Property-Based Tests

**PDF Generation Properties:**
- Generate random resume data with varying sections, verify all sections appear in PDF
- Generate random templates, verify template-specific formatting is applied
- Generate random contact info, verify all fields appear in header
- Generate random content, verify file size is under 5MB

**Sharing Properties:**
- Generate random email addresses, verify all are accepted and stored
- Generate multiple share tokens, verify all are unique
- Generate share links with various expiration durations, verify timestamps are correct
- Generate share links, verify format matches specification

**Versioning Properties:**
- Generate multiple resume updates, verify versions are created for each
- Generate versions, verify all data is stored completely
- Generate versions, verify history is ordered correctly
- Generate 50+ versions, verify older versions are archived

**Analytics Properties:**
- Generate multiple views, verify view records are created
- Generate views with various metadata, verify metadata is captured
- Generate views, verify metrics are calculated correctly
- Generate 10,000+ records, verify aggregation occurs

**Notification Properties:**
- Generate views, verify notifications are created
- Generate multiple views from same viewer, verify aggregation
- Generate notifications, verify all required fields are present

### Integration Tests

- Test full export flow: create resume → export PDF → verify file → check history
- Test full sharing flow: create share link → send email → access link → verify view recorded
- Test full versioning flow: create resume → update → view history → restore version
- Test full analytics flow: create shares → generate views → verify analytics dashboard
- Test full notification flow: enable notifications → create views → verify emails sent
- Test expiration enforcement: create link → wait for expiration → verify access denied
- Test revocation enforcement: create link → revoke → verify access denied

### Performance Tests

- Test PDF generation with large resumes (100+ sections)
- Test analytics queries with 10,000+ records
- Test version history retrieval with 50+ versions
- Test share link validation under high concurrency
- Test export history filtering with large datasets


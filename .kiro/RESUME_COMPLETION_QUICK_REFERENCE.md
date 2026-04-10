# Resume Completion Feature - Quick Reference Guide

## Feature Overview

The Resume Completion Feature adds comprehensive PDF export, advanced sharing, versioning, analytics, and notifications to the resume management system.

## Core Services

### 1. PDF Generation Service
**File**: `src/features/resume/pdf-generation-service.ts`

**Key Methods**:
- `generatePDF(resumeId, template, options)` - Generate PDF with template
- `generateATSExport(resumeId)` - Generate ATS-optimized text
- `recordExport(resumeId, metadata)` - Record export in history
- `getExportHistory(resumeId, filters)` - Retrieve export history

**Templates**: Modern, Classic, Minimal

**Rate Limit**: 10 exports/hour per user

### 2. Sharing Service
**File**: `src/features/resume/sharing-service.ts`

**Key Methods**:
- `createShareLink(resumeId, recipients, expirationDays)` - Create share links
- `validateShareToken(token)` - Validate share token
- `extendExpiration(token, days)` - Extend link expiration
- `revokeShareLink(token)` - Revoke link immediately
- `getShareLinks(resumeId)` - Get all share links

**Default Expiration**: 30 days

**Rate Limit**: 50 shares/hour per user

### 3. Versioning Service
**File**: `src/features/resume/versioning-service.ts`

**Key Methods**:
- `createVersion(resumeId, description)` - Create version snapshot
- `getVersionHistory(resumeId)` - Get all versions
- `restoreVersion(resumeId, versionId)` - Restore previous version
- `archiveOldVersions(resumeId)` - Archive versions (keep 50 most recent)

**Retention**: 90 days for deleted resume versions

### 4. Analytics Service
**File**: `src/features/resume/analytics-service.ts`

**Key Methods**:
- `recordView(resumeId, shareToken, metadata)` - Record view event
- `recordDownload(exportId)` - Record download
- `getAnalytics(resumeId)` - Get analytics dashboard
- `getRecentViewers(resumeId, limit)` - Get recent viewers

**Metrics**: Total views, unique viewers, download ratio, share ratio

**Rate Limit**: 100 queries/hour per user

### 5. Notification Service
**File**: `src/features/resume/notification-service.ts`

**Key Methods**:
- `createNotification(resumeId, metadata)` - Create notification
- `getNotifications(userId, limit, offset)` - Get notifications
- `updateNotificationPreferences(userId, prefs)` - Update preferences
- `sendNotificationEmailAsync(userId, resumeId, metadata)` - Send email

**Aggregation**: 1-hour window for same viewer

**Email Providers**: Resend, SendGrid

## API Endpoints

### PDF Export
```
POST   /api/resumes/{resumeId}/export
GET    /api/resumes/{resumeId}/export-history
GET    /api/resumes/{resumeId}/export-statistics
```

### Sharing
```
POST   /api/resumes/{resumeId}/share
GET    /api/resumes/{resumeId}/share-links
PATCH  /api/share-links/{shareToken}/extend
DELETE /api/share-links/{shareToken}
GET    /api/resumes/{resumeId}/view/{shareToken}  [PUBLIC]
```

### Versioning
```
GET    /api/resumes/{resumeId}/versions
POST   /api/resumes/{resumeId}/versions/{versionId}/restore
```

### Analytics
```
GET    /api/resumes/{resumeId}/analytics
GET    /api/resumes/{resumeId}/analytics/viewers
```

### Notifications
```
GET    /api/notifications
PATCH  /api/notifications/{notificationId}/read
PATCH  /api/notifications/preferences
```

## Infrastructure

### Caching
**File**: `src/lib/cache/resume-cache.ts`

**TTLs**:
- Export history: 1 hour
- Analytics: 30 minutes
- Share links: 5 minutes
- Version history: 1 hour
- Notifications: 30 minutes

**Usage**:
```typescript
import { getCachedAnalytics, setCachedAnalytics } from '@/lib/cache/resume-cache';

const cached = getCachedAnalytics(resumeId);
if (!cached) {
  const data = await AnalyticsService.getAnalytics(resumeId);
  setCachedAnalytics(resumeId, data);
}
```

### Cleanup Jobs
**File**: `src/lib/jobs/resume-cleanup.ts`

**Jobs**:
- `cleanupExpiredShareLinks()` - Daily
- `archiveOldVersions()` - Weekly
- `deleteOldNotifications()` - Daily

**Usage**:
```typescript
import { scheduleCleanupJobs } from '@/lib/jobs/resume-cleanup';

// Call at application startup
scheduleCleanupJobs();
```

### Error Handling
**File**: `src/lib/errors/resume-errors.ts`

**Error Types**:
- `PDFGenerationError`
- `SharingError`
- `VersioningError`
- `AnalyticsError`
- `NotificationError`

**Usage**:
```typescript
import { handleResumeError } from '@/lib/errors/resume-errors';

try {
  // operation
} catch (error) {
  const { statusCode, message, code } = handleResumeError(error);
  return NextResponse.json({ error: message }, { status: statusCode });
}
```

### Logging
**File**: `src/lib/logging/resume-logger.ts`

**Usage**:
```typescript
import { resumeLogger } from '@/lib/logging/resume-logger';

resumeLogger.logPDFExport(resumeId, userId, template, duration, fileSize);
resumeLogger.logShareLinkCreation(resumeId, userId, recipientCount, duration);
resumeLogger.logViewRecording(resumeId, duration);
```

## Database Models

### ResumeShareLink
```prisma
model ResumeShareLink {
  id              String    @id @default(cuid())
  resumeId        String
  shareToken      String    @unique
  recipientEmail  String?
  senderId        String
  createdAt       DateTime  @default(now())
  expiresAt       DateTime
  revokedAt       DateTime?
  viewCount       Int       @default(0)
  lastViewedAt    DateTime?
}
```

### ResumeVersion
```prisma
model ResumeVersion {
  id                String    @id @default(cuid())
  resumeId          String
  versionNumber     Int
  data              Json
  changeDescription String?
  createdAt         DateTime  @default(now())
  createdBy         String
  archivedAt        DateTime?
}
```

### ResumeExport
```prisma
model ResumeExport {
  id            String    @id @default(cuid())
  resumeId      String
  template      String
  fileSize      Int
  downloadCount Int       @default(0)
  userAgent     String?
  ipAddress     String?
  createdAt     DateTime  @default(now())
}
```

### ResumeView
```prisma
model ResumeView {
  id              String    @id @default(cuid())
  resumeId        String
  shareToken      String
  deviceType      String?
  browser         String?
  operatingSystem String?
  country         String?
  city            String?
  viewerEmail     String?
  timeSpentSeconds Int?
  createdAt       DateTime  @default(now())
}
```

### ResumeNotification
```prisma
model ResumeNotification {
  id              String    @id @default(cuid())
  userId          String
  resumeId        String
  type            String    // 'view' | 'download'
  viewerEmail     String?
  viewerName      String?
  aggregatedCount Int       @default(1)
  isRead          Boolean   @default(false)
  emailSent       Boolean   @default(false)
  createdAt       DateTime  @default(now())
}
```

### NotificationPreference
```prisma
model NotificationPreference {
  id                      String    @id @default(cuid())
  userId                  String    @unique
  viewNotifications       Boolean   @default(true)
  downloadNotifications   Boolean   @default(true)
  emailNotifications      Boolean   @default(true)
  aggregateViews          Boolean   @default(true)
  updatedAt               DateTime  @updatedAt
}
```

## Environment Variables

```env
# Email Configuration
EMAIL_PROVIDER=resend              # or sendgrid
RESEND_API_KEY=your_key
SENDGRID_API_KEY=your_key
EMAIL_FROM_ADDRESS=noreply@example.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://example.com
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Export | 10 | 1 hour |
| Share Creation | 50 | 1 hour |
| Analytics Query | 100 | 1 hour |
| View Recording | 1000 | 1 hour |

## Testing

### Run All Tests
```bash
npm run test
```

### Run Specific Test Suite
```bash
npm run test -- sharing-service.test.ts
npm run test -- versioning-service.test.ts
npm run test -- analytics-service.test.ts
```

### Test Coverage
```bash
npm run test -- --coverage
```

## Deployment Checklist

- [ ] Run database migrations: `npm run schema:migrate`
- [ ] Set environment variables
- [ ] Configure email provider (Resend or SendGrid)
- [ ] Initialize cleanup jobs at startup
- [ ] Set up external logging service
- [ ] Configure monitoring and alerts
- [ ] Run full test suite
- [ ] Perform manual testing
- [ ] Load testing for performance

## Common Tasks

### Export Resume as PDF
```typescript
import { PDFGenerationService } from '@/features/resume/pdf-generation-service';

const { buffer, filename } = await PDFGenerationService.generatePDF(
  resumeId,
  'modern',
  { includePhoto: true }
);
```

### Create Share Link
```typescript
import { SharingService } from '@/features/resume/sharing-service';

const links = await SharingService.createShareLink(
  resumeId,
  userId,
  ['recipient@example.com'],
  30  // 30 days expiration
);
```

### Get Analytics
```typescript
import { AnalyticsService } from '@/features/resume/analytics-service';

const analytics = await AnalyticsService.getAnalytics(resumeId);
console.log(`Total views: ${analytics.totalViews}`);
console.log(`Unique viewers: ${analytics.uniqueViewers}`);
```

### Create Version
```typescript
import { VersioningService } from '@/features/resume/versioning-service';

await VersioningService.createVersion(
  resumeId,
  'Updated experience section'
);
```

### Send Notification
```typescript
import { NotificationService } from '@/features/resume/notification-service';

await NotificationService.createNotification(resumeId, {
  type: 'view',
  viewerEmail: 'viewer@example.com',
  viewerName: 'John Doe'
});
```

## Troubleshooting

### Email Not Sending
1. Check `EMAIL_PROVIDER` environment variable
2. Verify API keys are set correctly
3. Check email logs: `resumeLogger.logEmailSending(...)`

### Cache Not Working
1. Verify cache TTL is set correctly
2. Check cache invalidation on updates
3. Monitor cache size: `getResumeCacheStats()`

### Performance Issues
1. Check database indexes are created
2. Verify caching is enabled
3. Monitor query performance with logging
4. Check rate limiting is working

## Support

For issues or questions:
1. Check error logs in `src/lib/logging/resume-logger.ts`
2. Review error types in `src/lib/errors/resume-errors.ts`
3. Check test files for usage examples
4. Review API endpoint implementations

---

**Last Updated**: April 10, 2026

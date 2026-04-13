# Resume Features Database Schema Documentation

## Overview

This document provides comprehensive documentation of the database schema for the Resume Features Completion system. The schema extends the existing Resume model with four new tables to support PDF export, AI optimization, analytics, and publishing capabilities.

## Database Architecture

### Connection Configuration

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Connection Pool Settings:**
- Max connections: 20
- Min connections: 5
- Connection timeout: 30 seconds
- Idle timeout: 900 seconds (15 minutes)

### Indexes Strategy

All tables use strategic indexing to optimize query performance:
- Composite indexes on frequently filtered columns
- Indexes on foreign keys for join operations
- Indexes on timestamp columns for range queries
- Partial indexes on status columns for filtered queries

---

## Table Schemas

### 1. ResumeAnalytics Table

Stores all resume engagement events (views, downloads, shares) with comprehensive metadata.

#### SQL Definition

```sql
CREATE TABLE ResumeAnalytics (
  id SERIAL PRIMARY KEY,
  resumeId VARCHAR(255) NOT NULL,
  eventType VARCHAR(50) NOT NULL,
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
  INDEX idx_sectionName (sectionName),
  INDEX idx_createdAt (createdAt)
);
```

#### Prisma Schema

```prisma
model ResumeAnalytics {
  id                  String    @id @default(cuid())
  resumeId            String
  eventType           String    // 'view', 'download', 'share'
  deviceType          String?   // 'desktop', 'mobile', 'tablet'
  browser             String?   // 'Chrome', 'Safari', 'Firefox', etc.
  operatingSystem     String?   // 'Windows', 'macOS', 'iOS', 'Android'
  country             String?   // Country name
  city                String?   // City name
  shareMethod         String?   // 'email', 'linkedin', 'twitter', etc.
  timeSpentSeconds    Int?      // Total time spent viewing resume
  scrollDepth         Int?      // Scroll depth percentage (0-100)
  sectionName         String?   // Resume section name
  viewerEmail         String?   // Viewer email (if available)
  viewerName          String?   // Viewer name (if available)
  metadata            Json?     // Additional metadata as JSON
  createdAt           DateTime  @default(now())
  resume              Resume    @relation("Analytics", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@index([resumeId, createdAt])
  @@index([eventType, createdAt])
  @@index([country])
  @@index([sectionName])
  @@index([createdAt])
}
```

#### Column Descriptions

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | Primary key, auto-incremented |
| resumeId | VARCHAR(255) | No | Foreign key to Resume table |
| eventType | VARCHAR(50) | No | Type of event: 'view', 'download', 'share' |
| deviceType | VARCHAR(50) | Yes | Device type: 'desktop', 'mobile', 'tablet' |
| browser | VARCHAR(100) | Yes | Browser name and version |
| operatingSystem | VARCHAR(100) | Yes | Operating system name |
| country | VARCHAR(100) | Yes | Country of viewer (from IP geolocation) |
| city | VARCHAR(100) | Yes | City of viewer (from IP geolocation) |
| shareMethod | VARCHAR(50) | Yes | Share method: 'email', 'linkedin', 'twitter', etc. |
| timeSpentSeconds | INT | Yes | Total seconds spent viewing resume |
| scrollDepth | INT | Yes | Percentage of resume scrolled (0-100) |
| sectionName | VARCHAR(255) | Yes | Resume section name for engagement tracking |
| viewerEmail | VARCHAR(255) | Yes | Email of viewer (if available) |
| viewerName | VARCHAR(255) | Yes | Name of viewer (if available) |
| metadata | JSONB | Yes | Additional metadata stored as JSON |
| createdAt | TIMESTAMP | No | Event timestamp, defaults to current time |

#### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| idx_resumeId_createdAt | (resumeId, createdAt) | Fast retrieval of events for a resume within date range |
| idx_eventType_createdAt | (eventType, createdAt) | Fast filtering by event type and date |
| idx_country | (country) | Geographic analysis queries |
| idx_sectionName | (sectionName) | Section engagement analysis |
| idx_createdAt | (createdAt) | Time-based queries and archival |

#### Typical Queries

```sql
-- Get all views for a resume in date range
SELECT * FROM ResumeAnalytics 
WHERE resumeId = 'resume_123' 
  AND eventType = 'view'
  AND createdAt BETWEEN '2024-03-01' AND '2024-03-31'
ORDER BY createdAt DESC;

-- Count views by country
SELECT country, COUNT(*) as view_count 
FROM ResumeAnalytics 
WHERE resumeId = 'resume_123' AND eventType = 'view'
GROUP BY country 
ORDER BY view_count DESC;

-- Get section engagement metrics
SELECT sectionName, 
       COUNT(*) as view_count,
       AVG(timeSpentSeconds) as avg_time_spent,
       AVG(scrollDepth) as avg_scroll_depth
FROM ResumeAnalytics 
WHERE resumeId = 'resume_123' AND sectionName IS NOT NULL
GROUP BY sectionName;
```

---

### 2. ResumeSuggestion Table

Stores AI-generated suggestions for resume improvement with approval workflow tracking.

#### SQL Definition

```sql
CREATE TABLE ResumeSuggestion (
  id SERIAL PRIMARY KEY,
  resumeId VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  originalText TEXT NOT NULL,
  suggestedText TEXT NOT NULL,
  explanation TEXT,
  confidenceLevel VARCHAR(20),
  targetField VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  appliedAt TIMESTAMP,
  FOREIGN KEY (resumeId) REFERENCES Resume(id) ON DELETE CASCADE,
  INDEX idx_resumeId_status (resumeId, status),
  INDEX idx_createdAt (createdAt)
);
```

#### Prisma Schema

```prisma
model ResumeSuggestion {
  id                  String    @id @default(cuid())
  resumeId            String
  category            String    // 'summary', 'achievement', 'skill', 'experience'
  originalText        String    // Original text from resume
  suggestedText       String    // Suggested improved text
  explanation         String?   // Explanation for the suggestion
  confidenceLevel     String?   // 'high', 'medium', 'low'
  targetField         String?   // Path to field: "experience[0].achievements[1]"
  status              String    @default("pending") // 'pending', 'approved', 'rejected'
  createdAt           DateTime  @default(now())
  appliedAt           DateTime? // When suggestion was applied
  resume              Resume    @relation("Suggestions", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@index([resumeId, status])
  @@index([createdAt])
}
```

#### Column Descriptions

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | Primary key, auto-incremented |
| resumeId | VARCHAR(255) | No | Foreign key to Resume table |
| category | VARCHAR(50) | No | Suggestion category: 'summary', 'achievement', 'skill', 'experience' |
| originalText | TEXT | No | Original text from resume |
| suggestedText | TEXT | No | Suggested improved text |
| explanation | TEXT | Yes | Explanation for why this suggestion improves the resume |
| confidenceLevel | VARCHAR(20) | Yes | AI confidence: 'high', 'medium', 'low' |
| targetField | VARCHAR(255) | Yes | Path to field in resume structure |
| status | VARCHAR(50) | No | Status: 'pending', 'approved', 'rejected' (default: 'pending') |
| createdAt | TIMESTAMP | No | When suggestion was generated |
| appliedAt | TIMESTAMP | Yes | When suggestion was applied (if approved) |

#### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| idx_resumeId_status | (resumeId, status) | Fast retrieval of pending suggestions for a resume |
| idx_createdAt | (createdAt) | Time-based queries and cleanup |

#### Typical Queries

```sql
-- Get all pending suggestions for a resume
SELECT * FROM ResumeSuggestion 
WHERE resumeId = 'resume_123' AND status = 'pending'
ORDER BY confidenceLevel DESC, createdAt DESC;

-- Get suggestion statistics
SELECT category, status, COUNT(*) as count
FROM ResumeSuggestion 
WHERE resumeId = 'resume_123'
GROUP BY category, status;

-- Get applied suggestions for audit trail
SELECT * FROM ResumeSuggestion 
WHERE resumeId = 'resume_123' AND status = 'approved'
ORDER BY appliedAt DESC;
```

---

### 3. ResumePublishing Table

Manages resume publication status and public access tracking.

#### SQL Definition

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

#### Prisma Schema

```prisma
model ResumePublishing {
  id                  String    @id @default(cuid())
  resumeId            String    @unique
  publicId            String    @unique // Unique public identifier
  published           Boolean   @default(false)
  publishedAt         DateTime? // When resume was published
  unpublishedAt       DateTime? // When resume was unpublished
  viewCount           Int       @default(0) // Total public views
  lastViewedAt        DateTime? // Last time resume was viewed publicly
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  resume              Resume    @relation("Publishing", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@index([publicId])
  @@index([published])
}
```

#### Column Descriptions

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | Primary key, auto-incremented |
| resumeId | VARCHAR(255) | No | Foreign key to Resume table (unique) |
| publicId | VARCHAR(255) | No | Unique public identifier for URL |
| published | BOOLEAN | No | Publication status (default: false) |
| publishedAt | TIMESTAMP | Yes | When resume was published |
| unpublishedAt | TIMESTAMP | Yes | When resume was unpublished |
| viewCount | INT | No | Total views of published resume (default: 0) |
| lastViewedAt | TIMESTAMP | Yes | Last time resume was viewed publicly |
| createdAt | TIMESTAMP | No | When record was created |
| updatedAt | TIMESTAMP | No | When record was last updated |

#### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| idx_publicId | (publicId) | Fast lookup by public URL |
| idx_published | (published) | Fast filtering of published resumes |

#### Typical Queries

```sql
-- Get publication status for a resume
SELECT * FROM ResumePublishing WHERE resumeId = 'resume_123';

-- Get published resume by public ID
SELECT * FROM ResumePublishing WHERE publicId = 'pub_xyz789' AND published = true;

-- Get all published resumes
SELECT * FROM ResumePublishing WHERE published = true ORDER BY publishedAt DESC;

-- Update view count
UPDATE ResumePublishing 
SET viewCount = viewCount + 1, lastViewedAt = NOW()
WHERE publicId = 'pub_xyz789';
```

---

### 4. ResumeSectionEngagement Table

Aggregated engagement metrics per resume section.

#### SQL Definition

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

#### Prisma Schema

```prisma
model ResumeSectionEngagement {
  id                  String    @id @default(cuid())
  resumeId            String
  sectionName         String    // Name of resume section
  viewCount           Int       @default(0) // Number of views of this section
  totalTimeSpentSeconds Int     @default(0) // Total time spent on section
  averageScrollDepth  Int       @default(0) // Average scroll depth (0-100)
  lastUpdatedAt       DateTime  @default(now())
  resume              Resume    @relation("SectionEngagement", fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@unique([resumeId, sectionName])
  @@index([resumeId])
}
```

#### Column Descriptions

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | Primary key, auto-incremented |
| resumeId | VARCHAR(255) | No | Foreign key to Resume table |
| sectionName | VARCHAR(255) | No | Name of resume section (e.g., 'Experience', 'Skills') |
| viewCount | INT | No | Number of times section was viewed (default: 0) |
| totalTimeSpentSeconds | INT | No | Total seconds spent viewing section (default: 0) |
| averageScrollDepth | INT | No | Average scroll depth percentage (default: 0) |
| lastUpdatedAt | TIMESTAMP | No | When metrics were last updated |

#### Constraints

- **Unique Constraint**: (resumeId, sectionName) - One record per section per resume
- **Foreign Key**: resumeId references Resume(id) with CASCADE delete

#### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| idx_resumeId | (resumeId) | Fast retrieval of all sections for a resume |
| unique_resume_section | (resumeId, sectionName) | Enforce uniqueness and fast lookup |

#### Typical Queries

```sql
-- Get engagement for all sections of a resume
SELECT * FROM ResumeSectionEngagement 
WHERE resumeId = 'resume_123'
ORDER BY viewCount DESC;

-- Calculate engagement percentage
SELECT sectionName, 
       viewCount,
       ROUND(100.0 * viewCount / SUM(viewCount) OVER (PARTITION BY resumeId), 2) as engagement_percentage
FROM ResumeSectionEngagement 
WHERE resumeId = 'resume_123'
ORDER BY viewCount DESC;

-- Get top sections by time spent
SELECT sectionName, totalTimeSpentSeconds, averageScrollDepth
FROM ResumeSectionEngagement 
WHERE resumeId = 'resume_123'
ORDER BY totalTimeSpentSeconds DESC;
```

---

## Resume Model Updates

The existing Resume model is extended with relationships to the new tables:

```prisma
model Resume {
  // ... existing fields ...
  
  // New relations for Resume Features
  analytics           ResumeAnalytics[]     @relation("Analytics")
  suggestions         ResumeSuggestion[]    @relation("Suggestions")
  publishing          ResumePublishing?     @relation("Publishing")
  sectionEngagement   ResumeSectionEngagement[] @relation("SectionEngagement")
}
```

---

## Data Relationships

### Entity Relationship Diagram

```
┌─────────────────────┐
│      Resume         │
│  (existing table)   │
└──────────┬──────────┘
           │
    ┌──────┼──────┬──────────┬──────────┐
    │      │      │          │          │
    ▼      ▼      ▼          ▼          ▼
┌────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│Analytics│ │ Suggestions  │ │ Publishing   │ │SectionEngagement │
│ (1:N)   │ │   (1:N)      │ │   (1:1)      │ │     (1:N)        │
└────────┘ └──────────────┘ └──────────────┘ └──────────────────┘
```

### Relationship Details

1. **Resume → ResumeAnalytics** (1:N)
   - One resume has many analytics events
   - Cascade delete: When resume is deleted, all analytics are deleted
   - Used for: Tracking all engagement events

2. **Resume → ResumeSuggestion** (1:N)
   - One resume has many suggestions
   - Cascade delete: When resume is deleted, all suggestions are deleted
   - Used for: AI suggestion workflow

3. **Resume → ResumePublishing** (1:1)
   - One resume has one publishing record
   - Cascade delete: When resume is deleted, publishing record is deleted
   - Used for: Publication status and public access

4. **Resume → ResumeSectionEngagement** (1:N)
   - One resume has many section engagement records
   - Cascade delete: When resume is deleted, all section engagement records are deleted
   - Used for: Aggregated section engagement metrics

---

## Data Retention and Archival

### Retention Policies

| Table | Retention Period | Archival Strategy |
|-------|------------------|-------------------|
| ResumeAnalytics | 1 year | Monthly archival to separate table |
| ResumeSuggestion | Indefinite | Kept for audit trail |
| ResumePublishing | Indefinite | Kept for publication history |
| ResumeSectionEngagement | 1 year | Recalculated from analytics |

### Archival Process

```sql
-- Monthly archival job (runs on 1st of each month)
INSERT INTO ResumeAnalytics_Archive 
SELECT * FROM ResumeAnalytics 
WHERE createdAt < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year');

DELETE FROM ResumeAnalytics 
WHERE createdAt < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year');
```

### Data Cleanup

```sql
-- Delete analytics for deleted resumes (90-day grace period)
DELETE FROM ResumeAnalytics 
WHERE resumeId NOT IN (SELECT id FROM Resume)
  AND createdAt < CURRENT_DATE - INTERVAL '90 days';

-- Delete old suggestions
DELETE FROM ResumeSuggestion 
WHERE status = 'rejected' 
  AND createdAt < CURRENT_DATE - INTERVAL '1 year';
```

---

## Performance Optimization

### Query Optimization Tips

1. **Always use resumeId in WHERE clause** for analytics queries
2. **Use date range filtering** to limit result sets
3. **Leverage indexes** on eventType and createdAt for time-series queries
4. **Use aggregation queries** instead of fetching all records
5. **Cache frequently accessed metrics** in Redis

### Connection Pooling

```typescript
// Prisma connection pool configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool settings (via DATABASE_URL)
// postgresql://user:password@host:5432/db?schema=public&connection_limit=20
```

### Materialized Views (Optional)

For frequently accessed aggregations, consider creating materialized views:

```sql
CREATE MATERIALIZED VIEW analytics_daily_summary AS
SELECT 
  resumeId,
  DATE(createdAt) as date,
  eventType,
  COUNT(*) as event_count,
  COUNT(DISTINCT viewerEmail) as unique_viewers
FROM ResumeAnalytics
GROUP BY resumeId, DATE(createdAt), eventType;

CREATE INDEX idx_analytics_daily_resumeId ON analytics_daily_summary(resumeId);
```

---

## Migration Guide

### Creating New Tables

```bash
# Generate migration
npx prisma migrate dev --name add_resume_features

# Apply migration to production
npx prisma migrate deploy
```

### Rollback Procedure

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back "add_resume_features"

# Reapply migration
npx prisma migrate deploy
```

---

## Backup and Recovery

### Backup Strategy

```bash
# Full database backup
pg_dump -U postgres -h localhost finberslink > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump -U postgres -h localhost -t ResumeAnalytics finberslink > analytics_backup.sql
```

### Recovery Procedure

```bash
# Restore full database
psql -U postgres -h localhost finberslink < backup_20240328_143000.sql

# Restore specific table
psql -U postgres -h localhost finberslink < analytics_backup.sql
```

---

## Monitoring and Maintenance

### Key Metrics to Monitor

- **Table Size**: Monitor growth of ResumeAnalytics table
- **Query Performance**: Track slow queries on analytics endpoints
- **Index Health**: Monitor index fragmentation
- **Connection Pool**: Monitor active connections

### Maintenance Tasks

```sql
-- Analyze table statistics (run weekly)
ANALYZE ResumeAnalytics;
ANALYZE ResumeSuggestion;
ANALYZE ResumePublishing;
ANALYZE ResumeSectionEngagement;

-- Reindex tables (run monthly)
REINDEX TABLE ResumeAnalytics;
REINDEX TABLE ResumeSuggestion;
REINDEX TABLE ResumePublishing;
REINDEX TABLE ResumeSectionEngagement;

-- Vacuum tables (run daily)
VACUUM ANALYZE ResumeAnalytics;
```

---

## Troubleshooting

### Common Issues

**Issue: Slow analytics queries**
- Solution: Check if indexes are being used with EXPLAIN ANALYZE
- Ensure date range filtering is applied
- Consider archiving old data

**Issue: High disk usage**
- Solution: Archive old analytics data
- Delete rejected suggestions older than 1 year
- Run VACUUM to reclaim space

**Issue: Foreign key constraint violations**
- Solution: Ensure resume exists before inserting related records
- Check cascade delete configuration
- Verify data integrity with constraints


# Database Migration Scripts

## Overview

This document contains all database migration scripts needed for the Resume Features Completion deployment. These scripts create the new tables and indexes required for the feature.

## Pre-Migration Checklist

- [ ] Database backup created
- [ ] Migration tested in staging environment
- [ ] Rollback procedure prepared
- [ ] Maintenance window scheduled
- [ ] Team notified of migration

## Migration Scripts

### Migration 1: Create ResumeAnalytics Table

**File**: `prisma/migrations/[timestamp]_create_resume_analytics/migration.sql`

```sql
-- Create ResumeAnalytics table
CREATE TABLE "ResumeAnalytics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resumeId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "deviceType" TEXT,
  "browser" TEXT,
  "operatingSystem" TEXT,
  "country" TEXT,
  "city" TEXT,
  "shareMethod" TEXT,
  "timeSpentSeconds" INTEGER,
  "scrollDepth" INTEGER,
  "sectionName" TEXT,
  "viewerEmail" TEXT,
  "viewerName" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResumeAnalytics_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE
);

-- Create indexes for ResumeAnalytics
CREATE INDEX "ResumeAnalytics_resumeId_createdAt_idx" ON "ResumeAnalytics"("resumeId", "createdAt");
CREATE INDEX "ResumeAnalytics_eventType_createdAt_idx" ON "ResumeAnalytics"("eventType", "createdAt");
CREATE INDEX "ResumeAnalytics_country_idx" ON "ResumeAnalytics"("country");
CREATE INDEX "ResumeAnalytics_sectionName_idx" ON "ResumeAnalytics"("sectionName");
```

### Migration 2: Create ResumeSuggestion Table

**File**: `prisma/migrations/[timestamp]_create_resume_suggestion/migration.sql`

```sql
-- Create ResumeSuggestion table
CREATE TABLE "ResumeSuggestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resumeId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "originalText" TEXT NOT NULL,
  "suggestedText" TEXT NOT NULL,
  "explanation" TEXT,
  "confidenceLevel" TEXT,
  "targetField" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  CONSTRAINT "ResumeSuggestion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE
);

-- Create indexes for ResumeSuggestion
CREATE INDEX "ResumeSuggestion_resumeId_status_idx" ON "ResumeSuggestion"("resumeId", "status");
CREATE INDEX "ResumeSuggestion_createdAt_idx" ON "ResumeSuggestion"("createdAt");
```

### Migration 3: Create ResumePublishing Table

**File**: `prisma/migrations/[timestamp]_create_resume_publishing/migration.sql`

```sql
-- Create ResumePublishing table
CREATE TABLE "ResumePublishing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resumeId" TEXT NOT NULL UNIQUE,
  "publicId" TEXT NOT NULL UNIQUE,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "unpublishedAt" TIMESTAMP(3),
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "lastViewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResumePublishing_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE
);

-- Create indexes for ResumePublishing
CREATE INDEX "ResumePublishing_publicId_idx" ON "ResumePublishing"("publicId");
CREATE INDEX "ResumePublishing_published_idx" ON "ResumePublishing"("published");
```

### Migration 4: Create ResumeSectionEngagement Table

**File**: `prisma/migrations/[timestamp]_create_resume_section_engagement/migration.sql`

```sql
-- Create ResumeSectionEngagement table
CREATE TABLE "ResumeSectionEngagement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resumeId" TEXT NOT NULL,
  "sectionName" TEXT NOT NULL,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "totalTimeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
  "averageScrollDepth" INTEGER NOT NULL DEFAULT 0,
  "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResumeSectionEngagement_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE,
  CONSTRAINT "ResumeSectionEngagement_resumeId_sectionName_key" UNIQUE("resumeId", "sectionName")
);

-- Create indexes for ResumeSectionEngagement
CREATE INDEX "ResumeSectionEngagement_resumeId_idx" ON "ResumeSectionEngagement"("resumeId");
```

### Migration 5: Update Resume Model with Relations

**File**: `prisma/migrations/[timestamp]_update_resume_relations/migration.sql`

```sql
-- This migration is handled by Prisma schema update
-- No SQL needed - Prisma will manage the relations
```

## Running Migrations

### Using Prisma CLI

```bash
# Run all pending migrations
npx prisma migrate deploy

# Create a new migration (if needed)
npx prisma migrate dev --name add_resume_features

# Check migration status
npx prisma migrate status

# Resolve migration issues
npx prisma migrate resolve --rolled-back <migration-name>
```

### Manual Migration (if needed)

```bash
# Connect to database
psql $DATABASE_URL

# Run migration scripts manually
\i prisma/migrations/[timestamp]_create_resume_analytics/migration.sql
\i prisma/migrations/[timestamp]_create_resume_suggestion/migration.sql
\i prisma/migrations/[timestamp]_create_resume_publishing/migration.sql
\i prisma/migrations/[timestamp]_create_resume_section_engagement/migration.sql

# Verify tables were created
\dt

# Verify indexes were created
\di
```

## Migration Verification

### Verify Tables Created

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ResumeAnalytics', 'ResumeSuggestion', 'ResumePublishing', 'ResumeSectionEngagement');

-- Expected output:
-- ResumeAnalytics
-- ResumeSuggestion
-- ResumePublishing
-- ResumeSectionEngagement
```

### Verify Columns Created

```sql
-- Check ResumeAnalytics columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ResumeAnalytics' 
ORDER BY ordinal_position;

-- Check ResumeSuggestion columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ResumeSuggestion' 
ORDER BY ordinal_position;

-- Check ResumePublishing columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ResumePublishing' 
ORDER BY ordinal_position;

-- Check ResumeSectionEngagement columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ResumeSectionEngagement' 
ORDER BY ordinal_position;
```

### Verify Indexes Created

```sql
-- Check all indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('ResumeAnalytics', 'ResumeSuggestion', 'ResumePublishing', 'ResumeSectionEngagement')
ORDER BY tablename, indexname;

-- Expected indexes:
-- ResumeAnalytics_resumeId_createdAt_idx
-- ResumeAnalytics_eventType_createdAt_idx
-- ResumeAnalytics_country_idx
-- ResumeAnalytics_sectionName_idx
-- ResumeSuggestion_resumeId_status_idx
-- ResumeSuggestion_createdAt_idx
-- ResumePublishing_publicId_idx
-- ResumePublishing_published_idx
-- ResumeSectionEngagement_resumeId_idx
```

### Verify Foreign Keys

```sql
-- Check foreign key constraints
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('ResumeAnalytics', 'ResumeSuggestion', 'ResumePublishing', 'ResumeSectionEngagement')
AND foreign_table_name IS NOT NULL;

-- Expected foreign keys:
-- ResumeAnalytics_resumeId_fkey -> Resume(id)
-- ResumeSuggestion_resumeId_fkey -> Resume(id)
-- ResumePublishing_resumeId_fkey -> Resume(id)
-- ResumeSectionEngagement_resumeId_fkey -> Resume(id)
```

## Rollback Procedures

### Rollback Using Prisma

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Verify rollback
npx prisma migrate status
```

### Manual Rollback

```bash
# Connect to database
psql $DATABASE_URL

# Drop tables in reverse order
DROP TABLE IF EXISTS "ResumeSectionEngagement" CASCADE;
DROP TABLE IF EXISTS "ResumePublishing" CASCADE;
DROP TABLE IF EXISTS "ResumeSuggestion" CASCADE;
DROP TABLE IF EXISTS "ResumeAnalytics" CASCADE;

# Verify tables were dropped
\dt
```

## Data Migration (if needed)

### Migrate Existing Data

If there is existing data that needs to be migrated:

```sql
-- Example: Migrate existing export events to ResumeAnalytics
INSERT INTO "ResumeAnalytics" (id, "resumeId", "eventType", "createdAt")
SELECT 
  gen_random_uuid()::text,
  "resumeId",
  'export' as "eventType",
  "createdAt"
FROM "ExportHistory"
WHERE "createdAt" > NOW() - INTERVAL '90 days';

-- Verify migration
SELECT COUNT(*) FROM "ResumeAnalytics" WHERE "eventType" = 'export';
```

## Performance Optimization

### Analyze Tables After Migration

```sql
-- Analyze tables to update statistics
ANALYZE "ResumeAnalytics";
ANALYZE "ResumeSuggestion";
ANALYZE "ResumePublishing";
ANALYZE "ResumeSectionEngagement";

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('ResumeAnalytics', 'ResumeSuggestion', 'ResumePublishing', 'ResumeSectionEngagement')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum Tables

```sql
-- Vacuum tables to reclaim space
VACUUM ANALYZE "ResumeAnalytics";
VACUUM ANALYZE "ResumeSuggestion";
VACUUM ANALYZE "ResumePublishing";
VACUUM ANALYZE "ResumeSectionEngagement";
```

## Monitoring During Migration

### Monitor Migration Progress

```bash
# Check migration status
npx prisma migrate status

# Monitor database activity
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"

# Monitor table sizes
psql $DATABASE_URL -c "
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('ResumeAnalytics', 'ResumeSuggestion', 'ResumePublishing', 'ResumeSectionEngagement')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Monitor Query Performance

```sql
-- Check slow queries during migration
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%ResumeAnalytics%' OR query LIKE '%ResumeSuggestion%'
ORDER BY total_time DESC
LIMIT 10;
```

## Post-Migration Verification

### Run Integration Tests

```bash
# Run integration tests to verify migrations
npm run test:integration

# Run specific migration tests
npm run test:integration -- --testNamePattern="migration"
```

### Verify Data Integrity

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM "ResumeAnalytics" 
WHERE "resumeId" NOT IN (SELECT id FROM "Resume");

SELECT COUNT(*) FROM "ResumeSuggestion" 
WHERE "resumeId" NOT IN (SELECT id FROM "Resume");

SELECT COUNT(*) FROM "ResumePublishing" 
WHERE "resumeId" NOT IN (SELECT id FROM "Resume");

SELECT COUNT(*) FROM "ResumeSectionEngagement" 
WHERE "resumeId" NOT IN (SELECT id FROM "Resume");

-- All should return 0
```

### Verify Constraints

```sql
-- Test foreign key constraints
BEGIN;
INSERT INTO "ResumeAnalytics" (id, "resumeId", "eventType") 
VALUES ('test-id', 'non-existent-resume', 'view');
-- Should fail with foreign key constraint error
ROLLBACK;
```

## Troubleshooting

### Migration Fails

```bash
# Check migration status
npx prisma migrate status

# Check for pending migrations
npx prisma migrate resolve --rolled-back <migration-name>

# Reset database (development only)
npx prisma migrate reset
```

### Slow Migration

```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Kill blocking queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE pid != pg_backend_pid() AND state = 'active';
```

### Data Inconsistency

```sql
-- Check for constraint violations
SELECT * FROM "ResumeAnalytics" 
WHERE "resumeId" NOT IN (SELECT id FROM "Resume");

-- Fix by deleting orphaned records
DELETE FROM "ResumeAnalytics" 
WHERE "resumeId" NOT IN (SELECT id FROM "Resume");
```

## Sign-Off

- [ ] Migrations tested in staging
- [ ] Rollback procedure verified
- [ ] Database backup created
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Migration executed successfully
- [ ] Post-migration verification passed
- [ ] Data integrity verified

Migration Date: _______
Executed By: _______
Verified By: _______

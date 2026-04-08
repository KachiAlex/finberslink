# Prisma to Firestore Migration Guide

## Overview

Complete migration from Prisma ORM with PostgreSQL to Google Cloud Firestore.

**Status**: In Progress
**Scope**: All API routes and service layers

---

## Migration Strategy

### Phase 1: Create Firestore Service Layer ✅
- Created `src/lib/firestore-service.ts` with all database operations
- Implements same interface as Prisma for easy replacement
- Supports all CRUD operations

### Phase 2: Migrate API Routes (In Progress)
- Replace Prisma imports with Firestore service
- Update all database calls
- Test each endpoint

### Phase 3: Migrate Service Layers
- Update feature services to use Firestore
- Maintain same function signatures
- Update type definitions

### Phase 4: Data Migration
- Export data from PostgreSQL
- Import into Firestore
- Verify data integrity

### Phase 5: Cleanup
- Remove Prisma dependencies
- Delete Prisma schema and migrations
- Update documentation

---

## Firestore Collections

### users
```
{
  id: string (auto-generated)
  email: string
  firstName: string
  lastName: string
  passwordHash: string
  role: 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  avatarUrl?: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### profiles
```
{
  id: string (userId)
  userId: string
  headline?: string
  location?: string
  bio?: string
  skills: string[]
  avatarUrl?: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### jobs
```
{
  id: string (auto-generated)
  title: string
  company: string
  description: string
  requirements: string[]
  location: string
  country: string
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
  remoteOption: 'REMOTE' | 'HYBRID' | 'ONSITE'
  salaryRange?: string
  tags: string[]
  featured: boolean
  isActive: boolean
  postedById: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### jobApplications
```
{
  id: string (auto-generated)
  userId: string
  jobOpportunityId: string
  resumeId: string
  status: 'SUBMITTED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'REJECTED'
  appliedAt: timestamp
  updatedAt: timestamp
}
```

### courses
```
{
  id: string (auto-generated)
  slug: string
  title: string
  tagline: string
  description: string
  category: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  coverImage: string
  instructorId: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### notifications
```
{
  id: string (auto-generated)
  userId: string
  type: string
  title: string
  body?: string
  actionUrl?: string
  readAt?: timestamp
  createdAt: timestamp
}
```

---

## Firestore Indexes Required

Create these indexes in Google Cloud Console:

### Index 1: jobs - isActive, createdAt
```
Collection: jobs
Fields:
  - isActive (Ascending)
  - createdAt (Descending)
```

### Index 2: jobApplications - userId, appliedAt
```
Collection: jobApplications
Fields:
  - userId (Ascending)
  - appliedAt (Descending)
```

### Index 3: jobApplications - jobOpportunityId, appliedAt
```
Collection: jobApplications
Fields:
  - jobOpportunityId (Ascending)
  - appliedAt (Descending)
```

### Index 4: courses - createdAt
```
Collection: courses
Fields:
  - createdAt (Descending)
```

### Index 5: notifications - userId, createdAt
```
Collection: notifications
Fields:
  - userId (Ascending)
  - createdAt (Descending)
```

---

## API Routes Migration Checklist

### Authentication Routes
- [ ] `/api/auth/register` - Update to use Firestore
- [ ] `/api/auth/login` - Update to use Firestore
- [ ] `/api/auth/logout` - No DB changes needed
- [ ] `/api/auth/refresh` - No DB changes needed
- [ ] `/api/auth/me` - Update to use Firestore

### Job Routes
- [ ] `/api/jobs` - Update to use Firestore
- [ ] `/api/jobs/[slug]` - Update to use Firestore
- [ ] `/api/jobs/[id]/applications` - Update to use Firestore
- [ ] `/api/admin/jobs` - Update to use Firestore
- [ ] `/api/admin/jobs/[id]` - Update to use Firestore
- [ ] `/api/admin/jobs/[id]/applications` - Update to use Firestore
- [ ] `/api/admin/applications/[id]` - Update to use Firestore
- [ ] `/api/user/applications` - Update to use Firestore
- [ ] `/api/user/applications/[id]` - Update to use Firestore
- [ ] `/api/user/dashboard` - Update to use Firestore

### Admin Routes
- [ ] `/api/admin/overview` - Update to use Firestore
- [ ] `/api/admin/users` - Update to use Firestore
- [ ] `/api/admin/analytics` - Update to use Firestore

### Course Routes
- [ ] `/api/courses` - Update to use Firestore
- [ ] `/api/courses/[slug]` - Update to use Firestore

---

## Service Layer Migration Checklist

### Jobs Service
- [ ] `getJobs()` - Migrate to Firestore
- [ ] `getJobById()` - Migrate to Firestore
- [ ] `createJob()` - Migrate to Firestore
- [ ] `updateJob()` - Migrate to Firestore
- [ ] `deleteJob()` - Migrate to Firestore
- [ ] `searchJobs()` - Migrate to Firestore
- [ ] `getJobTags()` - Migrate to Firestore

### Auth Service
- [ ] `findUserByEmail()` - Migrate to Firestore
- [ ] `createUser()` - Migrate to Firestore
- [ ] `updateUser()` - Migrate to Firestore

### Admin Service
- [ ] `requireAdminUser()` - Migrate to Firestore
- [ ] `getAdminOverview()` - Migrate to Firestore
- [ ] `listAdminCourses()` - Migrate to Firestore
- [ ] `createAdminCourse()` - Migrate to Firestore

### Forum Service
- [ ] `createForumThread()` - Migrate to Firestore
- [ ] `listForumThreads()` - Migrate to Firestore
- [ ] `getForumThreadById()` - Migrate to Firestore
- [ ] `createForumPost()` - Migrate to Firestore

### Course Service
- [ ] `listLearnerCourses()` - Migrate to Firestore
- [ ] `getLearnerCourseDetail()` - Migrate to Firestore
- [ ] `getLearnerLesson()` - Migrate to Firestore

### Notifications Service
- [ ] `createNotification()` - Migrate to Firestore
- [ ] `listUserNotifications()` - Migrate to Firestore
- [ ] `markNotificationAsRead()` - Migrate to Firestore
- [ ] `markAllNotificationsAsRead()` - Migrate to Firestore
- [ ] `getUnreadCount()` - Migrate to Firestore

---

## Migration Examples

### Before (Prisma)
```typescript
import { prisma } from '@/lib/prisma';

export async function getJobs(filters: JobFilters) {
  const jobs = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return jobs;
}
```

### After (Firestore)
```typescript
import { listJobs } from '@/lib/firestore-service';

export async function getJobs(filters: JobFilters) {
  const { jobs, total } = await listJobs(
    { isActive: true },
    filters.page,
    filters.limit
  );
  
  return jobs;
}
```

---

## Data Migration Steps

### Step 1: Export PostgreSQL Data
```bash
# Export users
psql -U postgres -d finberslink -c "COPY users TO STDOUT WITH CSV HEADER" > users.csv

# Export jobs
psql -U postgres -d finberslink -c "COPY job_opportunities TO STDOUT WITH CSV HEADER" > jobs.csv

# Export applications
psql -U postgres -d finberslink -c "COPY job_applications TO STDOUT WITH CSV HEADER" > applications.csv
```

### Step 2: Transform Data
```typescript
// Convert CSV to Firestore format
// Handle date conversions
// Map enum values
// Validate data
```

### Step 3: Import to Firestore
```bash
# Use Firebase CLI or custom script
firebase firestore:import backup.json
```

### Step 4: Verify Data
```typescript
// Count records
// Verify relationships
// Check data integrity
```

---

## Firestore Considerations

### Advantages
- ✅ Real-time database
- ✅ Automatic scaling
- ✅ Built-in security
- ✅ Easy backups
- ✅ Global distribution

### Limitations
- ❌ No complex joins (denormalize data)
- ❌ Limited query capabilities (use Algolia for full-text search)
- ❌ Eventual consistency
- ❌ Costs scale with reads/writes

### Best Practices
1. **Denormalize data** - Store related data together
2. **Batch operations** - Use batch writes for multiple updates
3. **Index queries** - Create indexes for frequently used queries
4. **Limit results** - Always use pagination
5. **Cache data** - Cache frequently accessed data

---

## Firestore Query Patterns

### Get by ID
```typescript
const doc = await db.collection('users').doc(userId).get();
```

### Query with filters
```typescript
const snapshot = await db.collection('jobs')
  .where('isActive', '==', true)
  .where('jobType', '==', 'FULL_TIME')
  .get();
```

### Pagination
```typescript
const snapshot = await db.collection('jobs')
  .orderBy('createdAt', 'desc')
  .offset((page - 1) * limit)
  .limit(limit)
  .get();
```

### Count
```typescript
const snapshot = await db.collection('jobs')
  .where('isActive', '==', true)
  .count()
  .get();
const count = snapshot.data().count;
```

### Batch write
```typescript
const batch = db.batch();
batch.set(docRef1, data1);
batch.update(docRef2, data2);
batch.delete(docRef3);
await batch.commit();
```

---

## Testing Strategy

### Unit Tests
- Test Firestore service functions
- Mock Firestore calls
- Test error handling

### Integration Tests
- Test API endpoints with real Firestore
- Test data persistence
- Test relationships

### Data Validation
- Verify all records migrated
- Check data types
- Validate relationships

---

## Rollback Plan

If migration fails:

1. **Keep PostgreSQL running** during migration
2. **Run parallel** - Keep both databases in sync
3. **Gradual rollout** - Migrate routes one at a time
4. **Feature flags** - Use feature flags to switch databases
5. **Backup** - Always have backups of both databases

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Create Firestore Service | 1 day | ✅ Done |
| Migrate API Routes | 2 days | In Progress |
| Migrate Service Layers | 1 day | Pending |
| Data Migration | 1 day | Pending |
| Testing & Validation | 1 day | Pending |
| Cleanup & Deployment | 1 day | Pending |
| **Total** | **~7 days** | **In Progress** |

---

## Success Criteria

- ✅ All API endpoints working with Firestore
- ✅ All data migrated successfully
- ✅ No data loss
- ✅ Performance acceptable
- ✅ Tests passing
- ✅ Prisma removed from codebase

---

## Support & Resources

- Firestore Docs: https://firebase.google.com/docs/firestore
- Firebase Admin SDK: https://firebase.google.com/docs/database/admin/start
- Migration Guide: https://firebase.google.com/docs/firestore/migrate-from-sql

---

**Status**: In Progress
**Last Updated**: March 1, 2024

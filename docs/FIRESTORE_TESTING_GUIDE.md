# Firestore Integration Testing Guide

## Overview
This guide provides comprehensive testing procedures for the Firestore migration. It covers unit tests, integration tests, end-to-end tests, and performance testing.

## Prerequisites
- Node.js 18+
- Firebase Emulator Suite installed
- Firestore credentials configured
- Test database setup

## 1. Unit Tests

### Testing Firestore Service Layer

Create `src/lib/__tests__/firestore-service.test.ts`:

```typescript
import * as FirestoreService from '@/lib/firestore-service';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'finbers-test',
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('FirestoreService', () => {
  describe('User Operations', () => {
    it('should create a user', async () => {
      const user = await FirestoreService.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashed_password',
        role: 'STUDENT',
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should find user by email', async () => {
      await FirestoreService.createUser({
        email: 'find@example.com',
        firstName: 'Find',
        lastName: 'User',
        passwordHash: 'hashed_password',
        role: 'STUDENT',
      });

      const user = await FirestoreService.findUserByEmail('find@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('find@example.com');
    });

    it('should find user by ID', async () => {
      const created = await FirestoreService.createUser({
        email: 'byid@example.com',
        firstName: 'ByID',
        lastName: 'User',
        passwordHash: 'hashed_password',
        role: 'STUDENT',
      });

      const user = await FirestoreService.findUserById(created.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
    });
  });

  describe('Job Operations', () => {
    it('should create a job', async () => {
      const job = await FirestoreService.createJob({
        title: 'Senior Developer',
        company: 'Tech Corp',
        location: 'New York',
        country: 'USA',
        jobType: 'FULL_TIME',
        remoteOption: 'HYBRID',
        description: 'Great opportunity',
        requirements: ['JavaScript', 'React'],
        tags: ['frontend', 'react'],
        featured: false,
        isActive: true,
        postedById: 'user123',
      });

      expect(job).toBeDefined();
      expect(job.title).toBe('Senior Developer');
      expect(job.company).toBe('Tech Corp');
    });

    it('should list jobs with pagination', async () => {
      const result = await FirestoreService.listJobs({}, 1, 10);
      expect(result.jobs).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should search jobs', async () => {
      const result = await FirestoreService.searchJobs('developer', 1, 10);
      expect(result.jobs).toBeDefined();
    });
  });

  describe('Application Operations', () => {
    it('should create an application', async () => {
      const app = await FirestoreService.createApplication({
        userId: 'user123',
        jobOpportunityId: 'job123',
        resumeId: 'resume123',
        status: 'SUBMITTED',
      });

      expect(app).toBeDefined();
      expect(app.status).toBe('SUBMITTED');
    });

    it('should list applications by user', async () => {
      const result = await FirestoreService.listApplicationsByUser('user123', 1, 10);
      expect(result.applications).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should update application status', async () => {
      const app = await FirestoreService.createApplication({
        userId: 'user123',
        jobOpportunityId: 'job123',
        resumeId: 'resume123',
        status: 'SUBMITTED',
      });

      await FirestoreService.updateApplication(app.id, { status: 'REVIEWING' });
      const updated = await FirestoreService.getApplicationById(app.id);
      expect(updated?.status).toBe('REVIEWING');
    });
  });

  describe('Notification Operations', () => {
    it('should create a notification', async () => {
      const notification = await FirestoreService.createNotification({
        userId: 'user123',
        type: 'APPLICATION_STATUS',
        title: 'Application Update',
        message: 'Your application status has changed',
      });

      expect(notification).toBeDefined();
      expect(notification.type).toBe('APPLICATION_STATUS');
    });

    it('should mark notification as read', async () => {
      const notification = await FirestoreService.createNotification({
        userId: 'user123',
        type: 'APPLICATION_STATUS',
        title: 'Application Update',
        message: 'Your application status has changed',
      });

      await FirestoreService.markNotificationAsRead(notification.id);
      const updated = await FirestoreService.getNotificationById(notification.id);
      expect(updated?.read).toBe(true);
    });
  });
});
```

## 2. Integration Tests

### Testing API Routes

Create `src/app/api/__tests__/auth.test.ts`:

```typescript
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

describe('Auth API Routes', () => {
  it('should register a new user', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'New',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('newuser@example.com');
  });

  it('should reject duplicate email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
      }),
    });

    // First registration
    await POST(request);

    // Second registration with same email
    const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'AnotherPassword123!',
        firstName: 'Another',
        lastName: 'User',
      }),
    });

    const response = await POST(request2);
    expect(response.status).toBe(400);
  });
});
```

## 3. End-to-End Tests

### Using Playwright

Create `e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register and login user', async ({ page }) => {
    // Register
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', 'e2e@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'User');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  it('should apply for a job', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Navigate to jobs
    await page.goto('/jobs');
    await page.click('a:has-text("View Details")');

    // Apply for job
    await page.click('button:has-text("Apply Now")');
    await page.selectOption('select[name="resumeId"]', 'resume123');
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Application submitted')).toBeVisible();
  });
});
```

## 4. Performance Testing

### Load Testing with k6

Create `k6/firestore-load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  // Test job listing
  const jobsRes = http.get('http://localhost:3000/api/jobs?page=1&limit=20');
  check(jobsRes, {
    'jobs list status is 200': (r) => r.status === 200,
    'jobs list response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test job search
  const searchRes = http.get('http://localhost:3000/api/jobs?search=developer');
  check(searchRes, {
    'job search status is 200': (r) => r.status === 200,
    'job search response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

## 5. Data Validation Tests

### Verify Data Integrity

Create `scripts/validate-migration.ts`:

```typescript
import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

const db = admin.firestore();
const prisma = new PrismaClient();

async function validateMigration() {
  console.log('Validating Firestore migration...\n');

  // Check user count
  const pgUsers = await prisma.user.count();
  const fsUsers = await db.collection('users').count().get();

  console.log(`PostgreSQL Users: ${pgUsers}`);
  console.log(`Firestore Users: ${fsUsers.data().count}`);

  if (pgUsers !== fsUsers.data().count) {
    console.warn('⚠️  User count mismatch!');
  }

  // Check job count
  const pgJobs = await prisma.jobOpportunity.count();
  const fsJobs = await db.collection('jobs').count().get();

  console.log(`\nPostgreSQL Jobs: ${pgJobs}`);
  console.log(`Firestore Jobs: ${fsJobs.data().count}`);

  if (pgJobs !== fsJobs.data().count) {
    console.warn('⚠️  Job count mismatch!');
  }

  // Check application count
  const pgApps = await prisma.jobApplication.count();
  const fsApps = await db.collection('jobApplications').count().get();

  console.log(`\nPostgreSQL Applications: ${pgApps}`);
  console.log(`Firestore Applications: ${fsApps.data().count}`);

  if (pgApps !== fsApps.data().count) {
    console.warn('⚠️  Application count mismatch!');
  }

  console.log('\n✅ Validation complete!');
}

validateMigration();
```

## 6. Testing Checklist

### Pre-Migration
- [ ] Backup PostgreSQL database
- [ ] Verify Firestore project is created
- [ ] Test Firebase credentials
- [ ] Review migration script

### During Migration
- [ ] Run migration script
- [ ] Monitor migration progress
- [ ] Check error logs
- [ ] Verify data counts match

### Post-Migration
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Run E2E tests
- [ ] Validate data integrity
- [ ] Performance testing
- [ ] User acceptance testing

### Rollback Plan
- [ ] Keep PostgreSQL database intact
- [ ] Document rollback procedure
- [ ] Test rollback process
- [ ] Monitor for issues

## 7. Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load testing
k6 run k6/firestore-load-test.js

# Validate migration
npx ts-node scripts/validate-migration.ts
```

## 8. Monitoring and Debugging

### Firestore Monitoring
- Monitor read/write operations in Firebase Console
- Check for quota usage
- Review error logs
- Monitor latency metrics

### Application Monitoring
- Check application logs
- Monitor API response times
- Track error rates
- Monitor database operations

## 9. Common Issues and Solutions

### Issue: Slow Queries
**Solution:** Add Firestore indexes for commonly queried fields

### Issue: Data Inconsistency
**Solution:** Run validation script and re-migrate affected data

### Issue: Authentication Failures
**Solution:** Verify JWT tokens and session handling

### Issue: Missing Data
**Solution:** Check migration logs and re-run migration for missing collections

## 10. Success Criteria

- All unit tests pass
- All integration tests pass
- All E2E tests pass
- Data integrity validated
- Performance benchmarks met
- Zero data loss
- Successful user acceptance testing

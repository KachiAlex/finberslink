# Firestore Migration Deployment Checklist

## Pre-Deployment Phase

### 1. Code Review and Testing
- [ ] Review all migrated API routes
- [ ] Verify Firestore service layer implementation
- [ ] Check error handling and logging
- [ ] Run linter: `npm run lint`
- [ ] Run type checking: `npx tsc --noEmit`
- [ ] All tests passing: `npm run test`

### 2. Database Preparation
- [ ] Backup PostgreSQL database
  ```bash
  pg_dump finberslink > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Verify Firestore project is created
- [ ] Set up Firestore collections manually or via script
- [ ] Verify Firebase credentials are correct
- [ ] Test Firebase Admin SDK connection

### 3. Environment Configuration
- [ ] Set up Firestore environment variables
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_SERVICE_ACCOUNT_KEY`
  - `NEXT_PUBLIC_FIREBASE_CONFIG`
- [ ] Remove PostgreSQL environment variables
- [ ] Verify JWT secrets are configured
- [ ] Test environment variable loading

### 4. Data Migration
- [ ] Run migration script in dry-run mode (if available)
  ```bash
  npx ts-node scripts/migrate-to-firestore.ts --dry-run
  ```
- [ ] Execute full data migration
  ```bash
  npx ts-node scripts/migrate-to-firestore.ts
  ```
- [ ] Validate migration statistics
- [ ] Check for migration errors
- [ ] Verify data integrity
  ```bash
  npx ts-node scripts/validate-migration.ts
  ```

### 5. Firestore Security Rules
- [ ] Deploy security rules to Firestore
  ```bash
  firebase deploy --only firestore:rules
  ```
- [ ] Verify rules allow authenticated access
- [ ] Test admin operations
- [ ] Test user operations
- [ ] Test public read operations

### 6. Firestore Indexes
- [ ] Create required indexes
  ```bash
  firebase deploy --only firestore:indexes
  ```
- [ ] Verify indexes are active
- [ ] Monitor index creation progress

## Staging Deployment

### 1. Build and Deploy
- [ ] Build application
  ```bash
  npm run build
  ```
- [ ] Verify build succeeds
- [ ] Deploy to staging environment
  ```bash
  git push staging main
  ```

### 2. Smoke Tests
- [ ] Application starts successfully
- [ ] Health check endpoint responds
- [ ] Database connection works
- [ ] API endpoints are accessible

### 3. Functional Testing
- [ ] User registration works
- [ ] User login works
- [ ] Job listing works
- [ ] Job search works
- [ ] Job application works
- [ ] Admin dashboard works
- [ ] Admin job management works
- [ ] Notifications work

### 4. Integration Testing
- [ ] Run integration tests
  ```bash
  npm run test:integration
  ```
- [ ] All tests pass
- [ ] No unexpected errors in logs

### 5. E2E Testing
- [ ] Run E2E tests
  ```bash
  npm run test:e2e
  ```
- [ ] All critical user flows work
- [ ] No data loss observed

### 6. Performance Testing
- [ ] Monitor API response times
- [ ] Check Firestore read/write operations
- [ ] Verify no performance degradation
- [ ] Load test with k6
  ```bash
  k6 run k6/firestore-load-test.js
  ```

### 7. Monitoring and Logging
- [ ] Application logs are being captured
- [ ] Error tracking is working
- [ ] Performance metrics are being recorded
- [ ] Firestore metrics are visible in Firebase Console

### 8. User Acceptance Testing
- [ ] Have stakeholders test critical workflows
- [ ] Verify data accuracy
- [ ] Check for any data inconsistencies
- [ ] Get sign-off from product team

## Production Deployment

### 1. Pre-Deployment Checklist
- [ ] All staging tests passed
- [ ] Stakeholder approval obtained
- [ ] Rollback plan is documented
- [ ] On-call team is notified
- [ ] Maintenance window is scheduled

### 2. Deployment Steps
- [ ] Create deployment branch
  ```bash
  git checkout -b deploy/firestore-migration
  ```
- [ ] Verify all changes are committed
- [ ] Deploy to production
  ```bash
  git push origin deploy/firestore-migration
  ```
- [ ] Monitor deployment progress
- [ ] Verify application is running

### 3. Post-Deployment Verification
- [ ] Application is accessible
- [ ] Health check passes
- [ ] Database connection works
- [ ] Critical APIs respond correctly
- [ ] No error spikes in logs

### 4. Monitoring (First 24 Hours)
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify Firestore operations
- [ ] Monitor resource usage
- [ ] Check user reports

### 5. Data Validation
- [ ] Run validation script
  ```bash
  npx ts-node scripts/validate-migration.ts
  ```
- [ ] Verify data counts match
- [ ] Check for data inconsistencies
- [ ] Spot-check sample records

## Rollback Plan

### If Critical Issues Occur

1. **Immediate Actions**
   - [ ] Notify team immediately
   - [ ] Stop accepting new requests if necessary
   - [ ] Prepare rollback

2. **Rollback Steps**
   - [ ] Revert to previous version
     ```bash
     git revert <commit-hash>
     git push origin main
     ```
   - [ ] Switch environment variables back to PostgreSQL
   - [ ] Restart application
   - [ ] Verify PostgreSQL connection works
   - [ ] Monitor for issues

3. **Post-Rollback**
   - [ ] Notify stakeholders
   - [ ] Document what went wrong
   - [ ] Plan fixes
   - [ ] Schedule retry

## Post-Deployment Tasks

### 1. Cleanup
- [ ] Archive old PostgreSQL backups
- [ ] Remove Prisma schema files (if not needed)
- [ ] Clean up migration scripts
- [ ] Update documentation

### 2. Optimization
- [ ] Review Firestore usage patterns
- [ ] Optimize queries if needed
- [ ] Add indexes for slow queries
- [ ] Monitor costs

### 3. Documentation
- [ ] Update README with Firestore setup
- [ ] Document any workarounds
- [ ] Update deployment guides
- [ ] Create runbooks for common issues

### 4. Team Training
- [ ] Train team on Firestore operations
- [ ] Document Firestore console access
- [ ] Create troubleshooting guides
- [ ] Schedule knowledge transfer sessions

## Success Criteria

- ✅ All API routes working with Firestore
- ✅ Data successfully migrated
- ✅ Zero data loss
- ✅ Performance meets or exceeds baseline
- ✅ All tests passing
- ✅ No critical errors in production
- ✅ User acceptance testing passed
- ✅ Monitoring and alerting working

## Monitoring Commands

### Firestore Operations
```bash
# View Firestore usage in Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/firestore

# Monitor real-time operations
firebase emulators:start --import=./firestore-data
```

### Application Logs
```bash
# View application logs
npm run logs

# Filter for errors
npm run logs | grep ERROR
```

### Performance Metrics
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/jobs
```

## Contacts and Escalation

- **On-Call Engineer**: [Name/Contact]
- **Product Manager**: [Name/Contact]
- **DevOps Lead**: [Name/Contact]
- **Database Administrator**: [Name/Contact]

## Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|-----------|----------|
| Pre-Deployment | 2-3 days | [Date] | [Date] |
| Staging | 3-5 days | [Date] | [Date] |
| Production | 1 day | [Date] | [Date] |
| Monitoring | 7 days | [Date] | [Date] |

## Notes

- Keep PostgreSQL database intact for 30 days post-migration
- Monitor Firestore costs closely during first month
- Plan for Firestore index creation time
- Document any custom configurations
- Schedule follow-up review meeting

## Sign-Off

- [ ] Technical Lead Approval: _________________ Date: _______
- [ ] Product Manager Approval: _________________ Date: _______
- [ ] DevOps Lead Approval: _________________ Date: _______

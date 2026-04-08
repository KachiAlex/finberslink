# Production Deployment Guide - Firestore Migration

## Overview

This guide provides step-by-step instructions for deploying the Firestore migration to production. Follow each section carefully to ensure a smooth transition from PostgreSQL to Firestore.

## Pre-Deployment Phase (1-2 days before)

### 1. Final Code Review
```bash
# Review all changes
git log --oneline -20

# Check for any uncommitted changes
git status

# Verify no Prisma references remain
grep -r "@prisma" src/ || echo "No Prisma imports found"
grep -r "prisma" package.json || echo "No Prisma in package.json"
```

### 2. Database Backup
```bash
# Backup PostgreSQL database
pg_dump finberslink > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql

# Store backup in secure location
# Keep for 30 days post-migration
```

### 3. Firestore Setup
```bash
# Verify Firestore project exists
firebase projects:list

# Check Firestore is enabled
firebase firestore:indexes:list

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 4. Environment Configuration
```bash
# Verify .env file has Firestore variables
grep FIREBASE_PROJECT_ID .env
grep FIREBASE_SERVICE_ACCOUNT_KEY .env
grep NEXT_PUBLIC_FIREBASE_CONFIG .env

# Verify no PostgreSQL variables
grep DATABASE_URL .env || echo "No DATABASE_URL found (good)"
```

### 5. Team Notification
- [ ] Notify engineering team
- [ ] Notify product team
- [ ] Notify customer support
- [ ] Schedule maintenance window if needed
- [ ] Prepare rollback team

## Staging Deployment (1 day before)

### 1. Build and Deploy to Staging
```bash
# Clean build
rm -rf .next
npm run build

# Deploy to staging
git checkout -b staging-firestore
git push origin staging-firestore

# Monitor build logs
# Verify deployment succeeds
```

### 2. Smoke Tests
```bash
# Test application health
curl -v http://staging.finberslink.com/health

# Test API endpoints
curl http://staging.finberslink.com/api/jobs
curl http://staging.finberslink.com/api/auth/me

# Verify Firestore connection
# Check Firebase Console for activity
```

### 3. Functional Testing
```bash
# Test critical workflows
# 1. User registration
# 2. User login
# 3. Job listing
# 4. Job search
# 5. Job application
# 6. Admin dashboard
# 7. Notifications

# Run automated tests
npm run test:e2e
```

### 4. Data Migration Test (Staging)
```bash
# Run migration script on staging data
npx ts-node scripts/migrate-to-firestore.ts

# Validate migration
npx ts-node scripts/validate-migration.ts

# Check Firestore collections
firebase firestore:delete --recursive --all
```

### 5. Performance Testing
```bash
# Run load tests
k6 run k6/firestore-load-test.js

# Monitor response times
# Check Firestore metrics in Firebase Console
# Verify no performance degradation
```

### 6. Stakeholder Sign-Off
- [ ] Technical lead approval
- [ ] Product manager approval
- [ ] DevOps lead approval
- [ ] Security review passed

## Production Deployment Day

### Pre-Deployment (Morning)

#### 1. Final Checks
```bash
# Verify code is ready
git status
git log --oneline -5

# Verify dependencies
npm ls

# Verify environment
cat .env | grep FIREBASE

# Verify backups exist
ls -lh backup_*.sql
```

#### 2. Notify Team
- [ ] Send deployment notification
- [ ] Confirm team is available
- [ ] Verify rollback team is ready
- [ ] Set up monitoring dashboard

#### 3. Prepare Rollback
```bash
# Document current state
git log --oneline -1 > deployment_state.txt
date >> deployment_state.txt

# Prepare rollback script
cat > rollback.sh << 'EOF'
#!/bin/bash
git revert <commit-hash>
git push origin main
# Switch env variables back to PostgreSQL
# Restart application
EOF
chmod +x rollback.sh
```

### Deployment Execution (During Maintenance Window)

#### 1. Stop Accepting New Requests
```bash
# Optional: Put application in maintenance mode
# Update status page
# Notify users
```

#### 2. Execute Data Migration
```bash
# Run migration script
npx ts-node scripts/migrate-to-firestore.ts

# Monitor progress
# Check for errors
# Verify statistics

# Expected output:
# Users: XXXX
# Profiles: XXXX
# Jobs: XXXX
# Applications: XXXX
# Courses: XXXX
# Notifications: XXXX
```

#### 3. Validate Data
```bash
# Run validation script
npx ts-node scripts/validate-migration.ts

# Verify counts match
# Check for data inconsistencies
# Spot-check sample records
```

#### 4. Deploy Application
```bash
# Deploy to production
git push origin main

# Monitor deployment
# Check build logs
# Verify application starts

# Expected: Application running with Firestore backend
```

#### 5. Post-Deployment Verification
```bash
# Health check
curl -v https://finberslink.com/health

# API endpoints
curl https://finberslink.com/api/jobs
curl https://finberslink.com/api/auth/me

# Database connectivity
# Check Firestore Console for activity

# Error logs
# Monitor application logs for errors
```

### Post-Deployment (First 24 Hours)

#### 1. Continuous Monitoring
```bash
# Monitor error rates
# Check API response times
# Verify Firestore operations
# Monitor resource usage
# Check user reports

# Key metrics to watch:
# - Error rate (should be < 0.1%)
# - API response time (should be < 500ms)
# - Firestore read/write operations
# - Database storage usage
```

#### 2. User Communication
- [ ] Update status page
- [ ] Send deployment notification
- [ ] Monitor user feedback
- [ ] Address any issues

#### 3. Data Verification
```bash
# Run validation again
npx ts-node scripts/validate-migration.ts

# Spot-check critical data
# Verify user accounts
# Check job postings
# Verify applications

# Compare with backup if needed
```

#### 4. Performance Analysis
```bash
# Analyze Firestore metrics
# Check query performance
# Review index usage
# Identify slow operations

# Optimize if needed:
# - Add indexes for slow queries
# - Adjust query patterns
# - Implement caching
```

#### 5. Team Debrief
- [ ] Collect feedback
- [ ] Document issues
- [ ] Plan improvements
- [ ] Schedule follow-up

## Rollback Procedure (If Needed)

### Immediate Actions
```bash
# Stop accepting new requests
# Put application in maintenance mode
# Notify team

# Assess issue severity
# Determine if rollback is necessary
```

### Execute Rollback
```bash
# Revert to previous version
git revert <commit-hash>
git push origin main

# Switch environment variables back to PostgreSQL
# Update .env with DATABASE_URL
# Remove Firestore variables

# Restart application
# Verify PostgreSQL connection works

# Monitor for issues
# Check error logs
# Verify data integrity
```

### Post-Rollback
```bash
# Notify users
# Update status page
# Document what went wrong
# Plan fixes

# Schedule retry:
# - Fix identified issues
# - Re-test thoroughly
# - Plan new deployment
```

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Error Rate**: Should be < 0.1%
2. **API Response Time**: Should be < 500ms
3. **Firestore Operations**: Monitor read/write counts
4. **Database Storage**: Monitor growth
5. **User Activity**: Monitor login/registration

### Alerting Rules
```
- Error rate > 1% → Alert
- API response time > 1000ms → Alert
- Firestore quota exceeded → Alert
- Database storage > 80% → Alert
- Unusual user activity → Alert
```

### Monitoring Tools
- Firebase Console
- Application logs
- Error tracking (Sentry, etc.)
- Performance monitoring (New Relic, etc.)
- Status page

## Post-Deployment Tasks (Week 1)

### 1. Data Verification
```bash
# Run comprehensive validation
npx ts-node scripts/validate-migration.ts

# Spot-check critical data
# Verify user accounts
# Check job postings
# Verify applications
# Check notifications
```

### 2. Performance Optimization
```bash
# Analyze Firestore usage
# Identify slow queries
# Add indexes if needed
# Optimize query patterns
# Implement caching
```

### 3. Cost Analysis
```bash
# Monitor Firestore costs
# Compare with PostgreSQL costs
# Identify optimization opportunities
# Plan cost reduction strategies
```

### 4. Documentation
```bash
# Update README
# Document Firestore setup
# Create runbooks
# Document troubleshooting procedures
# Update API documentation
```

### 5. Team Training
```bash
# Train team on Firestore operations
# Document common tasks
# Create troubleshooting guides
# Schedule knowledge transfer sessions
```

## Post-Deployment Tasks (Week 2-4)

### 1. PostgreSQL Cleanup
```bash
# Keep PostgreSQL for 30 days
# After 30 days, archive database
# Document archival process
# Verify no dependencies remain
```

### 2. Firestore Optimization
```bash
# Review index usage
# Optimize slow queries
# Implement caching strategies
# Monitor costs

# Potential optimizations:
# - Batch operations
# - Pagination
# - Caching
# - Query optimization
```

### 3. Documentation Updates
```bash
# Update deployment guides
# Document lessons learned
# Create best practices guide
# Update troubleshooting guide
```

### 4. Team Retrospective
```bash
# Collect feedback
# Document issues
# Plan improvements
# Schedule follow-up training
```

## Success Criteria

✅ **Deployment Success**
- Application deployed successfully
- All API routes working
- Firestore connection established
- Data migration completed

✅ **Data Integrity**
- Zero data loss
- Data counts match
- Referential integrity maintained
- No orphaned records

✅ **Performance**
- API response times < 500ms
- Error rate < 0.1%
- Firestore operations normal
- No performance degradation

✅ **User Experience**
- Users can login
- Users can apply for jobs
- Admin dashboard works
- Notifications work

✅ **Monitoring**
- Error tracking working
- Performance monitoring active
- Alerts configured
- Logs being captured

## Troubleshooting

### Issue: Application Won't Start
**Solution**:
1. Check Firestore credentials
2. Verify environment variables
3. Check Firebase project exists
4. Review application logs

### Issue: Slow Queries
**Solution**:
1. Add Firestore indexes
2. Optimize query patterns
3. Implement caching
4. Review Firestore metrics

### Issue: Data Missing
**Solution**:
1. Run validation script
2. Check migration logs
3. Re-migrate missing data
4. Verify data integrity

### Issue: High Costs
**Solution**:
1. Review Firestore usage
2. Optimize queries
3. Implement caching
4. Archive old data

## Support Contacts

- **On-Call Engineer**: [Name/Contact]
- **Product Manager**: [Name/Contact]
- **DevOps Lead**: [Name/Contact]
- **Database Administrator**: [Name/Contact]

## Deployment Checklist

- [ ] Code review completed
- [ ] Database backup created
- [ ] Firestore setup verified
- [ ] Environment configured
- [ ] Team notified
- [ ] Staging deployment successful
- [ ] Smoke tests passed
- [ ] Functional tests passed
- [ ] Data migration tested
- [ ] Performance tests passed
- [ ] Stakeholder approval obtained
- [ ] Rollback plan prepared
- [ ] Monitoring configured
- [ ] Production deployment executed
- [ ] Post-deployment verification completed
- [ ] Team debriefing completed
- [ ] Documentation updated

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Pre-Deployment | 1-2 days | [Date] | [Date] |
| Staging | 1 day | [Date] | [Date] |
| Production | 1 day | [Date] | [Date] |
| Monitoring | 7 days | [Date] | [Date] |
| Optimization | 7 days | [Date] | [Date] |

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Firestore migration to production. Follow each step carefully and monitor closely during and after deployment. Keep the rollback plan ready and don't hesitate to execute it if critical issues arise.

**Status**: Ready for Production Deployment

**Risk Level**: Low (with rollback plan in place)

**Estimated Duration**: 4-6 hours (including monitoring)

# Rollback Procedures

## Overview

This document outlines the procedures for rolling back the Resume Features Completion deployment in case of critical issues. It covers rollback triggers, step-by-step procedures, and verification steps.

## Rollback Triggers

### Automatic Rollback Triggers
The following conditions should trigger an automatic rollback:

1. **Error Rate Spike**
   - Condition: Error rate exceeds 5% for more than 5 minutes
   - Action: Automatic rollback initiated
   - Notification: PagerDuty alert + Slack notification

2. **API Service Unavailable**
   - Condition: API service health check fails for 2 consecutive checks (30 seconds)
   - Action: Automatic rollback initiated
   - Notification: PagerDuty alert + Slack notification

3. **Database Connection Failure**
   - Condition: Database connectivity check fails for 2 consecutive checks (30 seconds)
   - Action: Automatic rollback initiated
   - Notification: PagerDuty alert + Slack notification

### Manual Rollback Triggers
The following conditions should trigger a manual rollback decision:

1. **Critical Data Corruption**
   - Condition: Data integrity checks fail or data inconsistencies detected
   - Decision: On-call engineer + team lead
   - Timeline: Immediate

2. **Security Vulnerability**
   - Condition: Critical security vulnerability discovered in deployed code
   - Decision: Security lead + on-call engineer
   - Timeline: Immediate

3. **Performance Degradation**
   - Condition: API response time exceeds 5 seconds for more than 5 minutes
   - Decision: On-call engineer + team lead
   - Timeline: 5 minutes

4. **Database Performance Issues**
   - Condition: Database queries exceed 2 seconds for more than 5 minutes
   - Decision: On-call engineer + database team
   - Timeline: 5 minutes

5. **Queue Processing Failure**
   - Condition: Queue depth exceeds 10,000 jobs for more than 15 minutes
   - Decision: On-call engineer + team lead
   - Timeline: 10 minutes

6. **External Service Failure**
   - Condition: OpenAI API or S3 integration fails
   - Decision: On-call engineer
   - Timeline: 5 minutes (if critical path affected)

## Rollback Decision Process

### Step 1: Assess the Situation
1. Identify the issue and its severity
2. Check if issue is related to the deployment
3. Determine if rollback is the appropriate action
4. Estimate time to fix vs. time to rollback

### Step 2: Notify Team
1. Post in #critical-alerts Slack channel
2. Page on-call engineer if not already paged
3. Notify team lead and manager
4. Create incident ticket

### Step 3: Make Rollback Decision
- **Rollback**: If issue is critical and fix time is uncertain
- **Fix Forward**: If issue is minor and fix is quick (< 15 minutes)
- **Investigate**: If issue is unclear and needs investigation (< 5 minutes)

### Step 4: Execute Decision
- If rollback: Follow rollback procedures below
- If fix forward: Implement fix and monitor
- If investigate: Investigate and decide within 5 minutes

## Rollback Procedures

### Pre-Rollback Checklist
- [ ] Confirm rollback decision with team lead
- [ ] Notify all stakeholders in Slack
- [ ] Create incident ticket with rollback reason
- [ ] Prepare rollback commands
- [ ] Ensure database backup is available
- [ ] Ensure previous version is available
- [ ] Verify rollback plan with team

### Rollback Steps

#### Step 1: Stop Accepting New Requests
```bash
# Set API service to maintenance mode
curl -X POST http://localhost:3000/admin/maintenance-mode \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "message": "Maintenance in progress"}'

# Wait for in-flight requests to complete (max 30 seconds)
sleep 30
```

#### Step 2: Revert API Service
```bash
# Get previous version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

# Checkout previous version
git checkout $PREVIOUS_VERSION

# Rebuild application
npm run build

# Stop current service
systemctl stop api-service

# Deploy previous version
npm run deploy:production

# Start service
systemctl start api-service

# Verify service is running
sleep 5
curl http://localhost:3000/health
```

#### Step 3: Revert Database Schema (if applicable)
```bash
# Check if database migration is needed
npx prisma migrate status

# If migration was applied, rollback
if [ $? -eq 0 ]; then
  # Create backup before rollback
  pg_dump $DATABASE_URL > /backups/pre-rollback-$(date +%s).dump
  
  # Rollback migration
  npx prisma migrate resolve --rolled-back <migration-name>
  
  # Verify schema
  npx prisma db push --skip-generate
fi
```

#### Step 4: Clear Caches
```bash
# Clear Redis cache
redis-cli FLUSHDB

# Clear CDN cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

# Wait for cache clear to complete
sleep 10
```

#### Step 5: Verify System Stability
```bash
# Check API health
curl http://localhost:3000/health

# Check database connectivity
npx prisma db execute --stdin < /dev/null

# Check Redis connectivity
redis-cli ping

# Check queue status
redis-cli LLEN bull:analytics:*

# Monitor error rate
curl http://localhost:3000/metrics | grep http_requests_total
```

#### Step 6: Run Smoke Tests
```bash
# Run smoke tests
npm run test:smoke

# Check test results
if [ $? -ne 0 ]; then
  echo "Smoke tests failed, investigating..."
  # Investigate and potentially rollback further
fi
```

#### Step 7: Disable Maintenance Mode
```bash
# Disable maintenance mode
curl -X POST http://localhost:3000/admin/maintenance-mode \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### Post-Rollback Verification

#### Immediate Verification (5 minutes)
- [ ] API service responding to requests
- [ ] Error rate normal (< 0.1%)
- [ ] Response time normal (< 500ms)
- [ ] Database queries performing normally
- [ ] No data corruption detected
- [ ] Users can access resumes
- [ ] PDF export working
- [ ] Analytics tracking working

#### Extended Verification (30 minutes)
- [ ] Monitor error logs for anomalies
- [ ] Monitor performance metrics
- [ ] Check user feedback channels
- [ ] Verify all features working
- [ ] Verify data consistency
- [ ] Check queue processing
- [ ] Verify cache hit rates

#### Full Verification (2 hours)
- [ ] Run full test suite
- [ ] Verify all API endpoints
- [ ] Verify database integrity
- [ ] Verify analytics data accuracy
- [ ] Check for any data loss
- [ ] Review all logs for errors
- [ ] Confirm system stability

## Rollback Scenarios

### Scenario 1: API Service Crash

**Trigger**: API service health check fails

**Rollback Steps**:
1. Stop accepting new requests (maintenance mode)
2. Revert API service to previous version
3. Clear caches
4. Verify system stability
5. Run smoke tests
6. Disable maintenance mode

**Estimated Time**: 10-15 minutes

**Post-Rollback Actions**:
1. Investigate root cause
2. Review deployment logs
3. Identify code issue
4. Fix issue and test thoroughly
5. Plan re-deployment

### Scenario 2: Database Migration Failure

**Trigger**: Database schema change causes data corruption or query failures

**Rollback Steps**:
1. Stop accepting new requests (maintenance mode)
2. Restore database from backup
3. Revert API service to previous version
4. Clear caches
5. Verify system stability
6. Run smoke tests
7. Disable maintenance mode

**Estimated Time**: 15-30 minutes

**Post-Rollback Actions**:
1. Investigate migration issue
2. Review migration script
3. Test migration in staging
4. Fix migration and test thoroughly
5. Plan re-deployment

### Scenario 3: Performance Degradation

**Trigger**: API response time exceeds 5 seconds

**Rollback Steps**:
1. Investigate performance issue (5 minutes)
2. If issue is code-related:
   - Stop accepting new requests (maintenance mode)
   - Revert API service to previous version
   - Clear caches
   - Verify system stability
   - Run smoke tests
   - Disable maintenance mode
3. If issue is infrastructure-related:
   - Scale up infrastructure
   - Monitor performance
   - If still degraded, follow code rollback steps

**Estimated Time**: 10-20 minutes

**Post-Rollback Actions**:
1. Investigate performance issue
2. Profile code to identify bottleneck
3. Optimize code or infrastructure
4. Test thoroughly
5. Plan re-deployment

### Scenario 4: Data Corruption

**Trigger**: Data integrity checks fail

**Rollback Steps**:
1. Stop accepting new requests (maintenance mode)
2. Restore database from backup (pre-deployment backup)
3. Revert API service to previous version
4. Clear caches
5. Verify data integrity
6. Run smoke tests
7. Disable maintenance mode

**Estimated Time**: 20-30 minutes

**Post-Rollback Actions**:
1. Investigate data corruption cause
2. Review database migration script
3. Review code changes
4. Identify root cause
5. Fix issue and test thoroughly
6. Plan re-deployment

### Scenario 5: Security Vulnerability

**Trigger**: Critical security vulnerability discovered

**Rollback Steps**:
1. Immediately stop accepting new requests (maintenance mode)
2. Revert API service to previous version
3. Clear caches
4. Verify system stability
5. Run smoke tests
6. Disable maintenance mode
7. Notify security team

**Estimated Time**: 5-10 minutes

**Post-Rollback Actions**:
1. Investigate security vulnerability
2. Determine scope of exposure
3. Review security logs
4. Notify affected users if necessary
5. Fix vulnerability
6. Security review before re-deployment
7. Plan re-deployment

## Rollback Communication

### Immediate Communication (within 1 minute)
- Post in #critical-alerts: "Rollback initiated due to [reason]"
- Page on-call engineer if not already paged
- Create incident ticket

### During Rollback (every 5 minutes)
- Post status update in #critical-alerts
- Update incident ticket with progress
- Notify stakeholders of ETA

### Post-Rollback (within 5 minutes)
- Post in #critical-alerts: "Rollback complete, system stable"
- Post in #general: "Brief explanation of issue and rollback"
- Update incident ticket with completion time
- Schedule post-mortem

### Post-Mortem (within 24 hours)
- Conduct post-mortem meeting
- Document root cause
- Document lessons learned
- Create action items to prevent recurrence
- Share findings with team

## Rollback Testing

### Monthly Rollback Drill
- [ ] Schedule rollback drill
- [ ] Notify team
- [ ] Execute rollback procedure in staging
- [ ] Verify rollback works correctly
- [ ] Document any issues
- [ ] Update procedures if needed

### Rollback Drill Checklist
- [ ] Rollback procedure is clear and executable
- [ ] All team members understand their role
- [ ] Rollback can be completed within 15 minutes
- [ ] Verification steps confirm system stability
- [ ] Communication is clear and timely
- [ ] Post-mortem process is effective

## Escalation

### Escalation Path
1. **On-Call Engineer**: Initial response and investigation
2. **Team Lead**: Rollback decision and coordination
3. **Manager**: Stakeholder communication and escalation
4. **VP Engineering**: Executive communication (if needed)

### Escalation Triggers
- Rollback takes longer than 30 minutes
- Multiple rollbacks needed
- Data loss or corruption
- Security vulnerability
- Customer impact

## Appendix: Rollback Commands Reference

### Quick Rollback (API Service Only)
```bash
# Get previous version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

# Checkout and deploy
git checkout $PREVIOUS_VERSION
npm run build
systemctl restart api-service

# Verify
curl http://localhost:3000/health
```

### Full Rollback (API + Database)
```bash
# Backup current state
pg_dump $DATABASE_URL > /backups/rollback-$(date +%s).dump

# Restore from pre-deployment backup
psql $DATABASE_URL < /backups/pre-deployment.dump

# Revert API service
git checkout $(git describe --tags --abbrev=0 HEAD~1)
npm run build
systemctl restart api-service

# Clear caches
redis-cli FLUSHDB
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

# Verify
curl http://localhost:3000/health
```

### Verify Rollback Success
```bash
# Check API health
curl http://localhost:3000/health

# Check error rate
curl http://localhost:3000/metrics | grep http_requests_total

# Check database
npx prisma db execute --stdin < /dev/null

# Check Redis
redis-cli ping

# Run smoke tests
npm run test:smoke
```

# Deployment Quick Reference Guide

## Emergency Contacts

| Role | Name | Email | Phone | Slack |
|------|------|-------|-------|-------|
| DevOps Lead | [Name] | [Email] | [Phone] | @devops-lead |
| Database Admin | [Name] | [Email] | [Phone] | @dba |
| Security Lead | [Name] | [Email] | [Phone] | @security-lead |
| On-Call Engineer | [Name] | [Email] | [Phone] | @oncall |
| Product Manager | [Name] | [Email] | [Phone] | @pm |

## Pre-Deployment Checklist (5 minutes)

- [ ] All tests passing: `npm run test`
- [ ] Build successful: `npm run build`
- [ ] Database backup created: `pg_dump $DATABASE_URL > backup.dump`
- [ ] Staging deployment verified
- [ ] Team notified in Slack
- [ ] Maintenance window scheduled

## Deployment Steps (15-30 minutes)

### Step 1: Prepare (5 minutes)
```bash
# Create backup
pg_dump $DATABASE_URL -Fc -v -f /backups/pre-deployment-$(date +%s).dump

# Enable maintenance mode
curl -X POST http://localhost:3000/admin/maintenance-mode \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": true}'
```

### Step 2: Deploy (10 minutes)
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run migrations
npx prisma migrate deploy

# Deploy
npm run deploy:production

# Start service
systemctl start api-service
```

### Step 3: Verify (5 minutes)
```bash
# Check health
curl http://localhost:3000/health

# Check error rate
curl http://localhost:3000/metrics | grep http_requests_total

# Run smoke tests
npm run test:smoke

# Disable maintenance mode
curl -X POST http://localhost:3000/admin/maintenance-mode \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": false}'
```

## Rollback (5-10 minutes)

### Quick Rollback
```bash
# Revert to previous version
git checkout $(git describe --tags --abbrev=0 HEAD~1)

# Rebuild
npm run build

# Restart
systemctl restart api-service

# Verify
curl http://localhost:3000/health
```

### Full Rollback (with database)
```bash
# Restore database
pg_restore -d $DATABASE_URL /backups/pre-deployment-*.dump

# Revert code
git checkout $(git describe --tags --abbrev=0 HEAD~1)

# Rebuild and restart
npm run build
systemctl restart api-service

# Clear caches
redis-cli FLUSHDB

# Verify
curl http://localhost:3000/health
```

## Monitoring Commands

### Health Checks
```bash
# API health
curl http://localhost:3000/health

# Database
psql $DATABASE_URL -c "SELECT 1;"

# Redis
redis-cli ping

# Queue
redis-cli LLEN bull:analytics:*
```

### Performance Metrics
```bash
# Response time
curl http://localhost:3000/metrics | grep http_request_duration_seconds

# Error rate
curl http://localhost:3000/metrics | grep http_requests_total{status=~"5.."}

# Request rate
curl http://localhost:3000/metrics | grep http_requests_total

# Database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### Logs
```bash
# API logs
tail -f /var/log/api-service/error.log

# Database logs
tail -f /var/log/postgresql/postgresql.log

# System logs
journalctl -u api-service -n 100 -f
```

## Alert Response

### High Error Rate (> 5%)
1. Check logs: `tail -f /var/log/api-service/error.log`
2. Identify error pattern
3. If code issue: Rollback
4. If infrastructure issue: Scale up or fix

### High Response Time (> 1 second)
1. Check database: `psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"`
2. Check slow queries: `tail -f /var/log/postgresql/postgresql.log`
3. If query issue: Optimize or rollback
4. If infrastructure issue: Scale up

### Database Connection Pool Exhausted
1. Check connections: `psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"`
2. Kill long-running queries: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...;`
3. Restart service: `systemctl restart api-service`
4. Monitor: `watch -n 1 'psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"'`

### Queue Depth High (> 5000)
1. Check queue: `redis-cli LLEN bull:analytics:*`
2. Check processor: `systemctl status queue-processor`
3. Restart processor: `systemctl restart queue-processor`
4. Monitor: `watch -n 1 'redis-cli LLEN bull:analytics:*'`

## Deployment Artifacts

| Document | Purpose | Location |
|----------|---------|----------|
| Deployment Checklist | Pre/during/post deployment verification | DEPLOYMENT_CHECKLIST.md |
| Monitoring & Alerting | Metrics, dashboards, alerts, runbooks | MONITORING_AND_ALERTING.md |
| Rollback Procedures | Rollback triggers, steps, verification | ROLLBACK_PROCEDURES.md |
| Staging Guide | Staging deployment and testing | STAGING_DEPLOYMENT_GUIDE.md |
| Database Migrations | Migration scripts and procedures | DATABASE_MIGRATION_SCRIPTS.md |
| Backup & Recovery | Backup strategy, recovery procedures, DR | BACKUP_AND_RECOVERY_PROCEDURES.md |
| Deployment Summary | Overview and summary of all procedures | DEPLOYMENT_SUMMARY.md |

## Key Metrics

### Performance Targets
| Metric | Target | Alert |
|--------|--------|-------|
| PDF Generation | < 5 seconds | > 10 seconds |
| Analytics Query | < 500ms | > 2 seconds |
| API Response Time | < 500ms | > 1 second |
| Error Rate | < 0.1% | > 1% |
| Database Query | < 1 second | > 2 seconds |

### Capacity Targets
| Metric | Target |
|--------|--------|
| Concurrent Users | 1000 |
| Requests Per Second | 1000 |
| PDF Exports | 100 concurrent |
| Analytics Events | 1000 concurrent |
| Database Connections | 20 max |

## Slack Channels

| Channel | Purpose |
|---------|---------|
| #critical-alerts | Critical production alerts |
| #alerts | High priority alerts |
| #monitoring | Low priority alerts and metrics |
| #deployments | Deployment notifications |
| #incidents | Incident tracking and updates |

## Useful Links

- **Grafana Dashboard**: https://monitoring.example.com/grafana
- **Prometheus**: https://monitoring.example.com/prometheus
- **Kibana Logs**: https://logs.example.com/kibana
- **PagerDuty**: https://pagerduty.example.com
- **GitHub Repo**: https://github.com/example/finbers
- **Jira Board**: https://jira.example.com/browse/FINBERS

## Common Issues and Solutions

### Issue: API Service Won't Start
```bash
# Check logs
journalctl -u api-service -n 50

# Check disk space
df -h

# Check memory
free -h

# Restart service
systemctl restart api-service
```

### Issue: Database Connection Timeout
```bash
# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"

# Restart service
systemctl restart api-service
```

### Issue: High Memory Usage
```bash
# Check memory
free -h

# Check process memory
ps aux | grep node

# Restart service
systemctl restart api-service

# Monitor memory
watch -n 1 free -h
```

### Issue: Slow Queries
```bash
# Check slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Analyze query
EXPLAIN ANALYZE SELECT ...;

# Create index if needed
CREATE INDEX idx_name ON table(column);
```

## Deployment Phases

### Phase 1: Pre-Deployment (1-2 weeks)
- Review artifacts
- Prepare staging
- Create backups
- Schedule window
- Notify team

### Phase 2: Staging (1 week)
- Deploy to staging
- Run all tests
- Load testing
- Integration testing
- Get sign-off

### Phase 3: Production (deployment day)
- Create backup
- Run migrations
- Deploy service
- Deploy frontend
- Run smoke tests
- Monitor metrics

### Phase 4: Post-Deployment (1-2 weeks)
- Monitor logs
- Monitor metrics
- Verify features
- Check feedback
- Optimize if needed
- Conduct post-mortem

## Database Migrations

### Check Migration Status
```bash
npx prisma migrate status
```

### Run Migrations
```bash
npx prisma migrate deploy
```

### Rollback Migration
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

### Create New Migration
```bash
npx prisma migrate dev --name <migration-name>
```

## Backup and Recovery

### Create Backup
```bash
pg_dump $DATABASE_URL -Fc -v -f /backups/backup-$(date +%s).dump
```

### Restore Backup
```bash
pg_restore -d $DATABASE_URL /backups/backup-*.dump
```

### Verify Backup
```bash
pg_restore --list /backups/backup-*.dump
```

### Upload to S3
```bash
aws s3 cp /backups/backup-*.dump s3://$BACKUP_BUCKET/
```

## Testing Commands

### Run All Tests
```bash
npm run test
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run Property-Based Tests
```bash
npm run test:pbt
```

### Run Smoke Tests
```bash
npm run test:smoke
```

### Run Load Tests
```bash
npm run test:load
```

## Build Commands

### Build Application
```bash
npm run build
```

### Build Docker Image
```bash
docker build -t finbers:latest .
```

### Push to Registry
```bash
docker push $REGISTRY/finbers:latest
```

## Deployment Commands

### Deploy to Staging
```bash
npm run deploy:staging
```

### Deploy to Production
```bash
npm run deploy:production
```

### Deploy with Blue-Green
```bash
npm run deploy:blue-green
```

## Useful Queries

### Check Database Size
```sql
SELECT pg_size_pretty(pg_database_size('finbers'));
```

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Sizes
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Slow Queries
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Check Active Connections
```sql
SELECT 
  pid,
  usename,
  application_name,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle';
```

## Emergency Procedures

### If Everything is Down
1. Check infrastructure status
2. Check service logs
3. Restart services: `systemctl restart api-service`
4. Check database: `psql $DATABASE_URL -c "SELECT 1;"`
5. If still down, initiate rollback
6. If rollback fails, activate disaster recovery

### If Data is Corrupted
1. Stop application (maintenance mode)
2. Restore database from backup
3. Verify data integrity
4. Restart application
5. Run tests
6. Monitor for issues

### If Security Breach Detected
1. Immediately notify security team
2. Isolate affected systems
3. Preserve logs and evidence
4. Initiate incident response
5. Consider rollback if needed
6. Conduct security audit

## Post-Deployment Checklist

- [ ] All services responding
- [ ] Error rate normal (< 0.1%)
- [ ] Response time normal (< 500ms)
- [ ] Database performing well
- [ ] Analytics data accurate
- [ ] No data corruption
- [ ] User feedback positive
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Team notified

## Sign-Off

Deployment completed by: _________________ Date: _______
Verified by: _________________ Date: _______
Approved by: _________________ Date: _______

---

**Last Updated**: [Date]
**Version**: 1.0
**Next Review**: [Date]

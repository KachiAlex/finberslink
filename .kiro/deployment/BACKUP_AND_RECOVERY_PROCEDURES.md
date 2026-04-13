# Backup and Recovery Procedures

## Overview

This document outlines the backup and recovery procedures for the Resume Features Completion deployment. It covers backup strategies, recovery procedures, and disaster recovery planning.

## Backup Strategy

### Backup Types

#### 1. Database Backups

**Frequency**: Daily at 2 AM UTC

**Retention**: 
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

**Location**: S3 bucket with cross-region replication

**Backup Script**:
```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/finbers_backup_$TIMESTAMP.dump"

# Create backup
pg_dump $DATABASE_URL -Fc -v -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" "s3://$BACKUP_BUCKET/database/$TIMESTAMP.dump.gz"

# Verify backup
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE.gz"
  # Clean up local backup (keep last 3)
  ls -t $BACKUP_DIR/*.dump.gz | tail -n +4 | xargs rm -f
else
  echo "Backup failed"
  exit 1
fi
```

#### 2. Application Backups

**Frequency**: Before each deployment

**Retention**: Last 10 deployments

**Location**: Git tags and S3

**Backup Script**:
```bash
#!/bin/bash
# Application backup script

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TAG="backup-$TIMESTAMP"

# Create git tag
git tag -a $TAG -m "Pre-deployment backup"

# Push tag to remote
git push origin $TAG

# Create application archive
tar -czf /backups/app/finbers-app-$TIMESTAMP.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .

# Upload to S3
aws s3 cp /backups/app/finbers-app-$TIMESTAMP.tar.gz \
  s3://$BACKUP_BUCKET/application/$TIMESTAMP.tar.gz

echo "Application backup created: $TAG"
```

#### 3. Configuration Backups

**Frequency**: After each configuration change

**Retention**: Last 20 versions

**Location**: S3 and Git (for code-based config)

**Backup Script**:
```bash
#!/bin/bash
# Configuration backup script

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup environment variables
aws secretsmanager get-secret-value --secret-id prod/env > /backups/config/env-$TIMESTAMP.json

# Backup database configuration
pg_dump $DATABASE_URL --schema-only > /backups/config/schema-$TIMESTAMP.sql

# Upload to S3
aws s3 cp /backups/config/env-$TIMESTAMP.json s3://$BACKUP_BUCKET/config/
aws s3 cp /backups/config/schema-$TIMESTAMP.sql s3://$BACKUP_BUCKET/config/

echo "Configuration backup created"
```

#### 4. File Backups

**Frequency**: Daily

**Retention**: 30 days

**Location**: S3 with versioning enabled

**Backup Script**:
```bash
#!/bin/bash
# File backup script

# Backup uploaded files
aws s3 sync /var/uploads s3://$BACKUP_BUCKET/uploads/ --delete

# Backup logs
tar -czf /backups/logs/logs-$(date +%Y%m%d).tar.gz /var/log/

aws s3 cp /backups/logs/logs-$(date +%Y%m%d).tar.gz s3://$BACKUP_BUCKET/logs/

echo "File backup completed"
```

### Backup Verification

```bash
#!/bin/bash
# Backup verification script

# Verify database backup
echo "Verifying database backup..."
pg_restore --list /backups/database/latest.dump.gz > /dev/null
if [ $? -eq 0 ]; then
  echo "✓ Database backup is valid"
else
  echo "✗ Database backup is corrupted"
  exit 1
fi

# Verify application backup
echo "Verifying application backup..."
tar -tzf /backups/app/latest.tar.gz > /dev/null
if [ $? -eq 0 ]; then
  echo "✓ Application backup is valid"
else
  echo "✗ Application backup is corrupted"
  exit 1
fi

# Verify S3 backups
echo "Verifying S3 backups..."
aws s3 ls s3://$BACKUP_BUCKET/database/ | tail -1
aws s3 ls s3://$BACKUP_BUCKET/application/ | tail -1
aws s3 ls s3://$BACKUP_BUCKET/config/ | tail -1

echo "✓ All backups verified"
```

## Recovery Procedures

### Database Recovery

#### Scenario 1: Restore from Latest Backup

```bash
#!/bin/bash
# Restore database from latest backup

# Download latest backup from S3
LATEST_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/database/ | sort | tail -1 | awk '{print $4}')
aws s3 cp s3://$BACKUP_BUCKET/database/$LATEST_BACKUP /tmp/

# Decompress backup
gunzip /tmp/$LATEST_BACKUP

# Create new database
createdb $DATABASE_NAME

# Restore backup
pg_restore -d $DATABASE_NAME /tmp/${LATEST_BACKUP%.gz}

# Verify restore
psql $DATABASE_URL -c "SELECT COUNT(*) FROM Resume;"

echo "Database restored from $LATEST_BACKUP"
```

#### Scenario 2: Point-in-Time Recovery

```bash
#!/bin/bash
# Point-in-time recovery

# Find backup before target time
TARGET_TIME="2024-01-15 14:30:00"
BACKUP_FILE=$(aws s3 ls s3://$BACKUP_BUCKET/database/ | \
  awk -v target="$TARGET_TIME" '$0 < target' | tail -1 | awk '{print $4}')

# Download backup
aws s3 cp s3://$BACKUP_BUCKET/database/$BACKUP_FILE /tmp/

# Decompress
gunzip /tmp/$BACKUP_FILE

# Restore to temporary database
createdb temp_restore
pg_restore -d temp_restore /tmp/${BACKUP_FILE%.gz}

# Use pg_waldump to find exact recovery point
# (Advanced: requires WAL files)

# Restore to production database
pg_restore -d $DATABASE_URL /tmp/${BACKUP_FILE%.gz}

echo "Point-in-time recovery completed"
```

#### Scenario 3: Selective Table Recovery

```bash
#!/bin/bash
# Recover specific table from backup

TABLE_NAME="ResumeAnalytics"
BACKUP_FILE="/backups/database/latest.dump"

# Extract table from backup
pg_restore --table=$TABLE_NAME $BACKUP_FILE | psql $DATABASE_URL

echo "Table $TABLE_NAME recovered"
```

### Application Recovery

#### Scenario 1: Restore from Previous Deployment

```bash
#!/bin/bash
# Restore application from previous deployment

# Get previous version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

# Checkout previous version
git checkout $PREVIOUS_VERSION

# Rebuild application
npm run build

# Restart service
systemctl restart api-service

# Verify service
curl http://localhost:3000/health

echo "Application restored to $PREVIOUS_VERSION"
```

#### Scenario 2: Restore from Backup Archive

```bash
#!/bin/bash
# Restore application from backup archive

BACKUP_DATE="20240115"
BACKUP_FILE="finbers-app-$BACKUP_DATE.tar.gz"

# Download backup from S3
aws s3 cp s3://$BACKUP_BUCKET/application/$BACKUP_FILE /tmp/

# Extract backup
cd /opt/finbers
tar -xzf /tmp/$BACKUP_FILE

# Install dependencies
npm install

# Rebuild
npm run build

# Restart service
systemctl restart api-service

echo "Application restored from $BACKUP_FILE"
```

### Configuration Recovery

#### Scenario 1: Restore Environment Variables

```bash
#!/bin/bash
# Restore environment variables

BACKUP_DATE="20240115"

# Download backup
aws secretsmanager get-secret-value --secret-id prod/env-backup-$BACKUP_DATE \
  --query SecretString --output text > /tmp/env.json

# Restore to current secret
aws secretsmanager update-secret --secret-id prod/env \
  --secret-string file:///tmp/env.json

echo "Environment variables restored"
```

#### Scenario 2: Restore Database Schema

```bash
#!/bin/bash
# Restore database schema

BACKUP_DATE="20240115"
SCHEMA_FILE="/backups/config/schema-$BACKUP_DATE.sql"

# Download schema backup
aws s3 cp s3://$BACKUP_BUCKET/config/schema-$BACKUP_DATE.sql /tmp/

# Restore schema
psql $DATABASE_URL -f /tmp/schema-$BACKUP_DATE.sql

echo "Database schema restored"
```

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

- **Critical Data Loss**: < 1 hour
- **Application Failure**: < 30 minutes
- **Database Failure**: < 2 hours
- **Complete System Failure**: < 4 hours

### Recovery Point Objectives (RPO)

- **Database**: < 1 hour (daily backups)
- **Application**: < 1 deployment cycle
- **Configuration**: < 1 hour
- **Files**: < 1 day

### Disaster Recovery Scenarios

#### Scenario 1: Database Corruption

**Detection**: Data integrity checks fail

**Recovery Steps**:
1. Identify corrupted tables
2. Stop application (maintenance mode)
3. Restore database from latest backup
4. Verify data integrity
5. Run application tests
6. Resume normal operation

**Estimated Time**: 1-2 hours

#### Scenario 2: Application Crash

**Detection**: Health checks fail

**Recovery Steps**:
1. Check application logs
2. Restart application service
3. If restart fails, restore from previous version
4. Verify application is responding
5. Run smoke tests
6. Monitor for errors

**Estimated Time**: 15-30 minutes

#### Scenario 3: Complete System Failure

**Detection**: All services down

**Recovery Steps**:
1. Provision new infrastructure
2. Restore database from backup
3. Deploy application from backup
4. Restore configuration
5. Verify all services
6. Run full test suite
7. Resume normal operation

**Estimated Time**: 2-4 hours

#### Scenario 4: Data Center Failure

**Detection**: All services in primary region down

**Recovery Steps**:
1. Activate disaster recovery site
2. Restore database from cross-region backup
3. Deploy application to DR site
4. Update DNS to point to DR site
5. Verify all services
6. Monitor for issues
7. Plan migration back to primary

**Estimated Time**: 1-2 hours

### Disaster Recovery Testing

#### Monthly DR Drill

```bash
#!/bin/bash
# Monthly disaster recovery drill

echo "Starting DR drill..."

# 1. Restore database to test environment
echo "Restoring database..."
# (use database recovery procedure)

# 2. Restore application to test environment
echo "Restoring application..."
# (use application recovery procedure)

# 3. Run full test suite
echo "Running tests..."
npm run test

# 4. Verify all features
echo "Verifying features..."
npm run test:integration

# 5. Document results
echo "DR drill completed successfully"
```

#### Quarterly Full DR Test

- Restore complete system to alternate environment
- Verify all data is intact
- Verify all services are operational
- Run full test suite
- Document any issues
- Update procedures if needed

## Backup Monitoring

### Backup Health Checks

```bash
#!/bin/bash
# Backup health check script

# Check database backup age
LATEST_DB_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/database/ | sort | tail -1 | awk '{print $1, $2}')
BACKUP_AGE=$(( ($(date +%s) - $(date -d "$LATEST_DB_BACKUP" +%s)) / 3600 ))

if [ $BACKUP_AGE -gt 25 ]; then
  echo "WARNING: Database backup is $BACKUP_AGE hours old"
  # Send alert
fi

# Check backup size
BACKUP_SIZE=$(aws s3 ls s3://$BACKUP_BUCKET/database/ | tail -1 | awk '{print $3}')
if [ $BACKUP_SIZE -lt 1000000 ]; then
  echo "WARNING: Database backup size is suspiciously small: $BACKUP_SIZE bytes"
  # Send alert
fi

# Check S3 replication status
aws s3api head-bucket --bucket $BACKUP_BUCKET-replica
if [ $? -ne 0 ]; then
  echo "WARNING: Backup replication bucket is not accessible"
  # Send alert
fi

echo "Backup health check completed"
```

### Backup Alerts

Configure alerts for:
- Backup failure
- Backup older than 25 hours
- Backup size anomaly
- S3 replication failure
- Backup restore failure

## Backup Retention Policy

### Database Backups
- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months
- Yearly: 7 years (for compliance)

### Application Backups
- Last 10 deployments
- Last 12 monthly releases
- All tagged releases (indefinite)

### Configuration Backups
- Last 20 versions
- Last 12 monthly versions
- All tagged versions (indefinite)

### Log Backups
- Daily: 30 days
- Monthly: 12 months
- Yearly: 7 years (for compliance)

## Backup Automation

### Cron Jobs

```bash
# Add to crontab

# Daily database backup at 2 AM UTC
0 2 * * * /scripts/backup-database.sh >> /var/log/backup.log 2>&1

# Daily backup verification at 3 AM UTC
0 3 * * * /scripts/verify-backups.sh >> /var/log/backup.log 2>&1

# Weekly backup health check
0 4 * * 0 /scripts/backup-health-check.sh >> /var/log/backup.log 2>&1

# Monthly DR drill
0 5 1 * * /scripts/dr-drill.sh >> /var/log/backup.log 2>&1
```

### Backup Monitoring Dashboard

Create Grafana dashboard with:
- Last backup time
- Backup size trend
- Backup success rate
- Restore test results
- RTO/RPO metrics

## Sign-Off

- [ ] Backup procedures documented
- [ ] Recovery procedures tested
- [ ] DR plan reviewed
- [ ] Backup automation configured
- [ ] Monitoring configured
- [ ] Team trained on procedures
- [ ] Monthly DR drill scheduled

Backup Strategy Approved By: _________________ Date: _______
DR Plan Approved By: _________________ Date: _______

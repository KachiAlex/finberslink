# Database Backup & Recovery Procedures

## Overview

Comprehensive backup and disaster recovery procedures for the Finbers-Link application database.

---

## Backup Strategy

### Backup Types

#### 1. Full Backup
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Duration**: ~5-10 minutes
- **Size**: ~500 MB - 1 GB
- **Purpose**: Complete database snapshot

#### 2. Incremental Backup
- **Frequency**: Every 6 hours
- **Retention**: 7 days
- **Duration**: ~1-2 minutes
- **Size**: ~50-100 MB
- **Purpose**: Capture changes since last backup

#### 3. Transaction Log Backup
- **Frequency**: Every hour
- **Retention**: 3 days
- **Duration**: <1 minute
- **Size**: ~10-20 MB
- **Purpose**: Point-in-time recovery

#### 4. Backup Before Deployment
- **Frequency**: Before each production deployment
- **Retention**: Until next successful deployment
- **Duration**: ~5-10 minutes
- **Purpose**: Rollback capability

### Backup Schedule

```
Monday-Sunday:
  02:00 UTC - Full backup (daily)
  06:00 UTC - Incremental backup
  12:00 UTC - Incremental backup
  18:00 UTC - Incremental backup
  
Before Deployment:
  [Deployment Time] - Full backup
```

---

## Backup Implementation

### Using Neon (PostgreSQL Cloud)

#### Automated Backups
```bash
# Neon provides automated daily backups
# Access via Neon dashboard:
# 1. Go to https://console.neon.tech
# 2. Select your project
# 3. Go to "Backups" tab
# 4. View backup history and restore points
```

#### Manual Backup
```bash
# Create manual backup via Neon CLI
neon branches create --name backup-$(date +%Y%m%d-%H%M%S)

# Or via API
curl -X POST https://api.neon.tech/v2/projects/{project_id}/branches \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": {
      "name": "backup-'$(date +%Y%m%d-%H%M%S)'"
    }
  }'
```

### Using Self-Hosted PostgreSQL

#### Full Backup with pg_dump
```bash
#!/bin/bash
# backup.sh - Full database backup script

BACKUP_DIR="/backups/postgresql"
DB_NAME="finberslink"
DB_USER="postgres"
DB_HOST="localhost"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  echo "Backup successful: $BACKUP_FILE"
  
  # Upload to cloud storage
  aws s3 cp $BACKUP_FILE s3://your-backup-bucket/postgresql/
  
  # Keep only last 30 days
  find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
else
  echo "Backup failed!"
  exit 1
fi
```

#### Incremental Backup with WAL
```bash
#!/bin/bash
# wal_backup.sh - WAL (Write-Ahead Log) backup script

WAL_ARCHIVE_DIR="/var/lib/postgresql/wal_archive"
BACKUP_BUCKET="s3://your-backup-bucket/wal"

# Archive WAL files
for wal_file in $WAL_ARCHIVE_DIR/*.ready; do
  if [ -f "$wal_file" ]; then
    base_name=$(basename "$wal_file" .ready)
    aws s3 cp "$WAL_ARCHIVE_DIR/$base_name" "$BACKUP_BUCKET/"
    touch "$wal_file.done"
  fi
done
```

#### Scheduled Backups with Cron
```bash
# Add to crontab
# Full backup daily at 2 AM
0 2 * * * /usr/local/bin/backup.sh

# Incremental backup every 6 hours
0 0,6,12,18 * * * /usr/local/bin/incremental_backup.sh

# WAL backup every hour
0 * * * * /usr/local/bin/wal_backup.sh
```

---

## Backup Verification

### Verify Backup Integrity
```bash
# List backup files
ls -lh /backups/postgresql/

# Check backup size
du -sh /backups/postgresql/backup_*.sql.gz

# Verify backup is readable
gunzip -t /backups/postgresql/backup_*.sql.gz

# Test restore to temporary database
createdb test_restore
gunzip < /backups/postgresql/backup_*.sql.gz | psql test_restore
psql test_restore -c "SELECT COUNT(*) FROM users;"
dropdb test_restore
```

### Automated Backup Verification
```bash
#!/bin/bash
# verify_backups.sh - Verify backup integrity

BACKUP_DIR="/backups/postgresql"
LOG_FILE="/var/log/backup_verification.log"

for backup_file in $BACKUP_DIR/backup_*.sql.gz; do
  echo "Verifying $backup_file..." >> $LOG_FILE
  
  if gunzip -t "$backup_file" 2>&1 | tee -a $LOG_FILE; then
    echo "✓ Backup verified: $backup_file" >> $LOG_FILE
  else
    echo "✗ Backup failed verification: $backup_file" >> $LOG_FILE
    # Send alert
    mail -s "Backup Verification Failed" admin@example.com < $LOG_FILE
  fi
done
```

---

## Recovery Procedures

### Point-in-Time Recovery (PITR)

#### Using Neon
```bash
# Restore from specific point in time
neon branches create \
  --name restore-$(date +%Y%m%d-%H%M%S) \
  --parent-lsn {lsn_value}

# Or use Neon dashboard:
# 1. Go to Backups tab
# 2. Select desired restore point
# 3. Click "Restore"
```

#### Using Self-Hosted PostgreSQL
```bash
# 1. Stop application
systemctl stop finberslink

# 2. Stop PostgreSQL
systemctl stop postgresql

# 3. Restore from backup
createdb finberslink_restore
gunzip < /backups/postgresql/backup_2024_01_15.sql.gz | psql finberslink_restore

# 4. Verify restored database
psql finberslink_restore -c "SELECT COUNT(*) FROM users;"

# 5. If verification successful, swap databases
psql -c "DROP DATABASE finberslink;"
psql -c "ALTER DATABASE finberslink_restore RENAME TO finberslink;"

# 6. Start PostgreSQL
systemctl start postgresql

# 7. Start application
systemctl start finberslink
```

### Full Database Restore

#### Step-by-Step Recovery
```bash
#!/bin/bash
# recover.sh - Full database recovery script

set -e

BACKUP_FILE=$1
DB_NAME="finberslink"
DB_USER="postgres"
TEMP_DB="${DB_NAME}_recovery_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Starting recovery process..."

# Step 1: Create temporary database
echo "Creating temporary database: $TEMP_DB"
createdb -U $DB_USER $TEMP_DB

# Step 2: Restore backup
echo "Restoring backup from: $BACKUP_FILE"
gunzip < $BACKUP_FILE | psql -U $DB_USER -d $TEMP_DB

# Step 3: Verify recovery
echo "Verifying recovery..."
psql -U $DB_USER -d $TEMP_DB -c "SELECT COUNT(*) as user_count FROM users;"
psql -U $DB_USER -d $TEMP_DB -c "SELECT COUNT(*) as job_count FROM \"JobOpportunity\";"

# Step 4: Swap databases
echo "Swapping databases..."
psql -U $DB_USER -c "DROP DATABASE IF EXISTS ${DB_NAME}_backup;"
psql -U $DB_USER -c "ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_backup;"
psql -U $DB_USER -c "ALTER DATABASE $TEMP_DB RENAME TO $DB_NAME;"

echo "Recovery complete!"
echo "Previous database backed up as: ${DB_NAME}_backup"
echo "To rollback: DROP DATABASE $DB_NAME; ALTER DATABASE ${DB_NAME}_backup RENAME TO $DB_NAME;"
```

### Partial Recovery (Specific Tables)

```bash
# Restore specific table from backup
pg_restore -U postgres -d finberslink \
  --table=users \
  /backups/postgresql/backup_2024_01_15.sql.gz

# Restore multiple tables
pg_restore -U postgres -d finberslink \
  --table=users \
  --table=jobs \
  --table=applications \
  /backups/postgresql/backup_2024_01_15.sql.gz
```

---

## Disaster Recovery Plan

### RTO & RPO Targets

| Scenario | RTO | RPO |
|----------|-----|-----|
| Data corruption | 1 hour | 1 hour |
| Hardware failure | 4 hours | 1 hour |
| Ransomware attack | 2 hours | 1 hour |
| Accidental deletion | 30 minutes | 1 hour |
| Regional outage | 24 hours | 6 hours |

### Recovery Procedures by Scenario

#### Scenario 1: Data Corruption
1. Identify corrupted data
2. Restore from most recent backup
3. Verify data integrity
4. Resume operations
5. Document incident

#### Scenario 2: Hardware Failure
1. Provision new hardware
2. Restore latest backup
3. Verify connectivity
4. Run health checks
5. Resume operations

#### Scenario 3: Ransomware Attack
1. Isolate affected systems
2. Restore from clean backup (before infection)
3. Verify no malware in backup
4. Restore to clean environment
5. Implement security measures

#### Scenario 4: Accidental Deletion
1. Identify deletion time
2. Restore from backup before deletion
3. Merge with current data if needed
4. Verify recovery
5. Resume operations

#### Scenario 5: Regional Outage
1. Activate secondary region
2. Restore database to secondary
3. Update DNS/routing
4. Verify application connectivity
5. Monitor for issues

---

## Backup Storage

### Local Storage
- **Location**: `/backups/postgresql/`
- **Capacity**: 1 TB
- **Retention**: 30 days
- **Backup**: Daily to cloud

### Cloud Storage (AWS S3)

```bash
# Upload backups to S3
aws s3 sync /backups/postgresql/ s3://your-backup-bucket/postgresql/ \
  --delete \
  --storage-class GLACIER

# Retrieve backup from S3
aws s3 cp s3://your-backup-bucket/postgresql/backup_2024_01_15.sql.gz \
  /backups/postgresql/
```

### Multi-Region Replication

```bash
# Enable S3 cross-region replication
aws s3api put-bucket-replication \
  --bucket your-backup-bucket \
  --replication-configuration '{
    "Role": "arn:aws:iam::ACCOUNT:role/s3-replication",
    "Rules": [{
      "Status": "Enabled",
      "Priority": 1,
      "Destination": {
        "Bucket": "arn:aws:s3:::your-backup-bucket-replica",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": {"Minutes": 15}
        }
      }
    }]
  }'
```

---

## Monitoring & Alerts

### Backup Monitoring Script

```bash
#!/bin/bash
# monitor_backups.sh - Monitor backup health

BACKUP_DIR="/backups/postgresql"
ALERT_EMAIL="admin@example.com"
MAX_AGE_HOURS=25

# Check if backup exists and is recent
latest_backup=$(ls -t $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$latest_backup" ]; then
  echo "No backup found!" | mail -s "ALERT: No backup found" $ALERT_EMAIL
  exit 1
fi

# Check backup age
backup_time=$(stat -f%m "$latest_backup" 2>/dev/null || stat -c%Y "$latest_backup")
current_time=$(date +%s)
age_hours=$(( (current_time - backup_time) / 3600 ))

if [ $age_hours -gt $MAX_AGE_HOURS ]; then
  echo "Backup is $age_hours hours old (max: $MAX_AGE_HOURS)" | \
    mail -s "ALERT: Backup too old" $ALERT_EMAIL
  exit 1
fi

# Check backup size
backup_size=$(du -h "$latest_backup" | cut -f1)
echo "Latest backup: $(basename $latest_backup) - Size: $backup_size - Age: ${age_hours}h"
```

### CloudWatch Monitoring (AWS)

```bash
# Monitor backup metrics
aws cloudwatch put-metric-data \
  --namespace "Finberslink/Backups" \
  --metric-name "BackupAge" \
  --value $age_hours \
  --unit Hours

# Create alarm for old backups
aws cloudwatch put-metric-alarm \
  --alarm-name "backup-age-alert" \
  --alarm-description "Alert if backup is older than 25 hours" \
  --metric-name BackupAge \
  --namespace Finberslink/Backups \
  --statistic Maximum \
  --period 3600 \
  --threshold 25 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:region:account:topic-name
```

---

## Testing & Validation

### Monthly Backup Test

```bash
#!/bin/bash
# test_backup_recovery.sh - Monthly backup recovery test

echo "Starting monthly backup recovery test..."

# Select random backup from last 30 days
backup_file=$(find /backups/postgresql -name "backup_*.sql.gz" -mtime -30 | shuf | head -1)

if [ -z "$backup_file" ]; then
  echo "No backup found for testing"
  exit 1
fi

echo "Testing recovery from: $backup_file"

# Create test database
test_db="finberslink_test_$(date +%s)"
createdb $test_db

# Restore backup
gunzip < $backup_file | psql -d $test_db

# Run validation queries
echo "Validating restored data..."
psql -d $test_db -c "SELECT COUNT(*) as users FROM users;"
psql -d $test_db -c "SELECT COUNT(*) as jobs FROM \"JobOpportunity\";"
psql -d $test_db -c "SELECT COUNT(*) as applications FROM \"JobApplication\";"

# Check data integrity
psql -d $test_db -c "SELECT COUNT(*) FROM users WHERE email IS NULL;"

# Cleanup
dropdb $test_db

echo "Backup recovery test completed successfully!"
```

---

## Backup Checklist

### Daily
- [ ] Verify backup completed
- [ ] Check backup file size
- [ ] Verify backup uploaded to cloud
- [ ] Monitor backup logs

### Weekly
- [ ] Test backup recovery
- [ ] Verify cloud backup integrity
- [ ] Check backup storage usage
- [ ] Review backup logs

### Monthly
- [ ] Full recovery test
- [ ] Verify multi-region replication
- [ ] Review backup strategy
- [ ] Update disaster recovery plan

---

## Documentation

### Backup Inventory
```
Date: 2024-01-15
Backup File: backup_20240115_020000.sql.gz
Size: 750 MB
Location: /backups/postgresql/
Cloud: s3://your-backup-bucket/postgresql/
Verified: Yes
Recovery Tested: Yes
```

### Recovery Log
```
Date: 2024-01-10
Scenario: Test recovery
Backup Used: backup_20240110_020000.sql.gz
Duration: 15 minutes
Status: Success
Data Verified: Yes
```

---

## Contacts & Escalation

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Database Admin | [Name] | [Phone] | [Email] |
| DevOps Lead | [Name] | [Phone] | [Email] |
| CTO | [Name] | [Phone] | [Email] |
| On-Call | [Name] | [Phone] | [Email] |

---

**Last Updated**: March 1, 2024
**Next Review**: April 1, 2024
**Status**: Active

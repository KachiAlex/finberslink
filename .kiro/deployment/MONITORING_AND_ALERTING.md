# Monitoring and Alerting Setup

## Overview

This document outlines the monitoring and alerting strategy for the Resume Features Completion deployment. It covers metrics collection, dashboard setup, alert thresholds, and escalation procedures.

## Metrics Collection

### Application Metrics

#### API Performance
- **Endpoint Response Time**: Track response time for each API endpoint
  - Target: < 500ms for 95th percentile
  - Alert: > 1000ms for 5 minutes
  - Collection: Application instrumentation (e.g., Express middleware)

- **Request Rate**: Track requests per second for each endpoint
  - Target: Support 1000 RPS
  - Alert: > 1500 RPS for 5 minutes
  - Collection: Application instrumentation

- **Error Rate**: Track percentage of failed requests
  - Target: < 0.1%
  - Alert: > 1% for 5 minutes
  - Collection: Application instrumentation

- **PDF Generation Time**: Track time to generate PDF
  - Target: < 5 seconds for 95th percentile
  - Alert: > 10 seconds for 3 consecutive requests
  - Collection: PDF service instrumentation

- **AI Suggestion Generation Time**: Track time to generate suggestions
  - Target: < 30 seconds for 95th percentile
  - Alert: > 60 seconds for 3 consecutive requests
  - Collection: AI service instrumentation

- **Analytics Query Time**: Track time to retrieve analytics data
  - Target: < 500ms for 95th percentile
  - Alert: > 2000ms for 5 minutes
  - Collection: Analytics service instrumentation

#### Business Metrics
- **PDF Exports**: Count of successful and failed PDF exports
  - Alert: > 10% failure rate for 10 minutes
  - Collection: Application instrumentation

- **AI Suggestions Generated**: Count of suggestions generated
  - Alert: < 10 suggestions/hour (potential service issue)
  - Collection: Application instrumentation

- **Analytics Events Recorded**: Count of analytics events
  - Alert: < 100 events/hour (potential tracking issue)
  - Collection: Application instrumentation

- **Resumes Published**: Count of published resumes
  - Alert: None (informational only)
  - Collection: Application instrumentation

### Database Metrics

#### Connection Pool
- **Active Connections**: Current number of active database connections
  - Target: < 15 of 20 max
  - Alert: > 18 connections for 5 minutes
  - Collection: Database driver instrumentation

- **Connection Wait Time**: Time waiting for available connection
  - Target: < 10ms
  - Alert: > 100ms for 5 minutes
  - Collection: Database driver instrumentation

- **Connection Errors**: Failed connection attempts
  - Alert: > 5 errors in 5 minutes
  - Collection: Database driver instrumentation

#### Query Performance
- **Slow Queries**: Queries taking > 1 second
  - Alert: > 5 slow queries in 5 minutes
  - Collection: Database query logging

- **Query Count**: Total queries per second
  - Target: < 500 QPS
  - Alert: > 1000 QPS for 5 minutes
  - Collection: Database instrumentation

- **Replication Lag**: Delay between primary and replica
  - Target: < 100ms
  - Alert: > 1000ms for 5 minutes
  - Collection: Database replication monitoring

#### Data Integrity
- **Deadlocks**: Database deadlock occurrences
  - Alert: > 0 deadlocks in 5 minutes
  - Collection: Database error logging

- **Constraint Violations**: Foreign key or unique constraint violations
  - Alert: > 5 violations in 5 minutes
  - Collection: Application error logging

### Cache Metrics (Redis)

- **Hit Rate**: Percentage of cache hits
  - Target: > 80%
  - Alert: < 60% for 10 minutes
  - Collection: Redis instrumentation

- **Memory Usage**: Current Redis memory usage
  - Target: < 80% of allocated
  - Alert: > 90% for 5 minutes
  - Collection: Redis monitoring

- **Evictions**: Number of keys evicted due to memory pressure
  - Alert: > 100 evictions in 5 minutes
  - Collection: Redis instrumentation

- **Connection Count**: Active Redis connections
  - Target: < 50
  - Alert: > 100 for 5 minutes
  - Collection: Redis monitoring

### Queue Metrics (Bull)

- **Queue Depth**: Number of pending jobs in queue
  - Target: < 1000
  - Alert: > 5000 for 10 minutes
  - Collection: Bull queue instrumentation

- **Job Processing Time**: Time to process a job
  - Target: < 5 seconds for 95th percentile
  - Alert: > 30 seconds for 3 consecutive jobs
  - Collection: Bull queue instrumentation

- **Job Failure Rate**: Percentage of failed jobs
  - Target: < 0.1%
  - Alert: > 1% for 10 minutes
  - Collection: Bull queue instrumentation

- **Job Retry Count**: Number of job retries
  - Alert: > 100 retries in 5 minutes
  - Collection: Bull queue instrumentation

### Infrastructure Metrics

#### Server Resources
- **CPU Usage**: Percentage of CPU utilization
  - Target: < 70%
  - Alert: > 85% for 5 minutes
  - Collection: OS monitoring (e.g., Prometheus node exporter)

- **Memory Usage**: Percentage of memory utilization
  - Target: < 75%
  - Alert: > 90% for 5 minutes
  - Collection: OS monitoring

- **Disk Usage**: Percentage of disk space used
  - Target: < 80%
  - Alert: > 90% for 1 minute
  - Collection: OS monitoring

- **Network I/O**: Network bytes in/out per second
  - Target: < 100 Mbps
  - Alert: > 500 Mbps for 5 minutes
  - Collection: OS monitoring

#### Service Availability
- **API Service Health**: HTTP health check endpoint
  - Target: 200 OK response
  - Alert: Non-200 response for 2 consecutive checks
  - Collection: Health check monitoring

- **Database Availability**: Database connectivity check
  - Target: Successful connection
  - Alert: Failed connection for 2 consecutive checks
  - Collection: Health check monitoring

- **Redis Availability**: Redis connectivity check
  - Target: Successful connection
  - Alert: Failed connection for 2 consecutive checks
  - Collection: Health check monitoring

## Monitoring Stack

### Recommended Tools

1. **Metrics Collection**: Prometheus
   - Scrape interval: 15 seconds
   - Retention: 15 days
   - Configuration: Prometheus config file

2. **Visualization**: Grafana
   - Dashboard refresh: 30 seconds
   - Retention: 90 days
   - Dashboards: See dashboard definitions below

3. **Alerting**: Prometheus AlertManager
   - Evaluation interval: 1 minute
   - Alert routing: See alert routing below

4. **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
   - Log retention: 30 days
   - Index rotation: Daily
   - Log level: INFO for production

5. **Tracing**: Jaeger (optional, for performance analysis)
   - Sampling rate: 10% in production
   - Retention: 7 days

## Dashboard Setup

### Main Dashboard
- API response time (line chart)
- Error rate (line chart)
- Request rate (line chart)
- Database connection pool usage (gauge)
- Redis memory usage (gauge)
- Queue depth (line chart)
- CPU usage (line chart)
- Memory usage (line chart)

### Application Dashboard
- PDF export success rate (gauge)
- PDF export average time (gauge)
- AI suggestion generation success rate (gauge)
- AI suggestion generation average time (gauge)
- Analytics events per minute (line chart)
- Resumes published (counter)
- Active users (gauge)

### Database Dashboard
- Query count per second (line chart)
- Slow query count (line chart)
- Connection pool usage (gauge)
- Replication lag (line chart)
- Deadlock count (counter)
- Constraint violations (counter)

### Infrastructure Dashboard
- CPU usage by server (line chart)
- Memory usage by server (line chart)
- Disk usage by server (gauge)
- Network I/O by server (line chart)
- Service availability (status)

## Alert Routing

### Alert Channels

1. **Critical Alerts** (immediate action required)
   - Channels: PagerDuty, SMS, Slack #critical-alerts
   - Escalation: On-call engineer → Team lead → Manager
   - Response time: < 5 minutes

2. **High Priority Alerts** (urgent action required)
   - Channels: Slack #alerts, Email
   - Escalation: On-call engineer → Team lead
   - Response time: < 15 minutes

3. **Medium Priority Alerts** (action required within business hours)
   - Channels: Slack #alerts, Email
   - Escalation: Team lead
   - Response time: < 1 hour

4. **Low Priority Alerts** (informational)
   - Channels: Slack #monitoring
   - Escalation: None
   - Response time: < 1 business day

### Alert Rules

#### Critical Alerts
```yaml
- alert: APIServiceDown
  expr: up{job="api-service"} == 0
  for: 2m
  annotations:
    severity: critical
    summary: "API service is down"

- alert: DatabaseDown
  expr: up{job="database"} == 0
  for: 2m
  annotations:
    severity: critical
    summary: "Database is down"

- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  annotations:
    severity: critical
    summary: "Error rate exceeds 5%"

- alert: DatabaseConnectionPoolExhausted
  expr: db_connections_active / db_connections_max > 0.9
  for: 5m
  annotations:
    severity: critical
    summary: "Database connection pool nearly exhausted"
```

#### High Priority Alerts
```yaml
- alert: HighResponseTime
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
  for: 5m
  annotations:
    severity: high
    summary: "API response time exceeds 1 second"

- alert: HighQueueDepth
  expr: bull_queue_depth > 5000
  for: 10m
  annotations:
    severity: high
    summary: "Queue depth exceeds 5000 jobs"

- alert: HighCPUUsage
  expr: node_cpu_usage > 0.85
  for: 5m
  annotations:
    severity: high
    summary: "CPU usage exceeds 85%"

- alert: HighMemoryUsage
  expr: node_memory_usage > 0.9
  for: 5m
  annotations:
    severity: high
    summary: "Memory usage exceeds 90%"
```

#### Medium Priority Alerts
```yaml
- alert: SlowQueries
  expr: rate(db_slow_queries_total[5m]) > 5
  for: 5m
  annotations:
    severity: medium
    summary: "More than 5 slow queries per 5 minutes"

- alert: LowCacheHitRate
  expr: redis_hit_rate < 0.6
  for: 10m
  annotations:
    severity: medium
    summary: "Cache hit rate below 60%"

- alert: HighDiskUsage
  expr: node_disk_usage > 0.9
  for: 1m
  annotations:
    severity: medium
    summary: "Disk usage exceeds 90%"
```

## Runbook Examples

### Alert: API Service Down

**Severity**: Critical

**Steps**:
1. Check API service status: `systemctl status api-service`
2. Check API service logs: `journalctl -u api-service -n 100`
3. Restart API service: `systemctl restart api-service`
4. Verify service is running: `curl http://localhost:3000/health`
5. If still down, check database connectivity
6. If database is down, follow "Database Down" runbook
7. If service won't start, check disk space and memory
8. Escalate to DevOps if issue persists

### Alert: High Error Rate

**Severity**: Critical

**Steps**:
1. Check error logs: `tail -f /var/log/api-service/error.log`
2. Identify error pattern (database, external API, validation, etc.)
3. Check related service status (database, Redis, external APIs)
4. If database issue, follow "Database Down" runbook
5. If external API issue, check API status page
6. If validation errors, check recent code deployments
7. Consider rolling back recent deployment if errors started after deployment
8. Escalate to development team if issue persists

### Alert: Database Connection Pool Exhausted

**Severity**: Critical

**Steps**:
1. Check active connections: `SELECT count(*) FROM pg_stat_activity;`
2. Identify long-running queries: `SELECT * FROM pg_stat_activity WHERE state != 'idle';`
3. Kill long-running queries if safe: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...;`
4. Check for connection leaks in application logs
5. Restart API service to reset connections: `systemctl restart api-service`
6. Monitor connection pool usage after restart
7. If issue persists, increase connection pool size
8. Escalate to database team if issue persists

### Alert: High Queue Depth

**Severity**: High

**Steps**:
1. Check queue status: `redis-cli LLEN bull:analytics:*`
2. Check queue processor logs: `tail -f /var/log/queue-processor/error.log`
3. Verify queue processor is running: `systemctl status queue-processor`
4. Check for failed jobs: `redis-cli LRANGE bull:analytics:failed 0 -1`
5. Restart queue processor: `systemctl restart queue-processor`
6. Monitor queue depth after restart
7. If queue depth continues to grow, scale up queue processors
8. Escalate to DevOps if issue persists

## Maintenance

### Daily Tasks
- Review critical alerts and incidents
- Check error logs for patterns
- Verify all services are healthy

### Weekly Tasks
- Review performance metrics
- Analyze slow query logs
- Check disk space usage
- Review alert thresholds for accuracy

### Monthly Tasks
- Review and update alert rules
- Analyze performance trends
- Plan capacity upgrades if needed
- Review and update runbooks

### Quarterly Tasks
- Security audit of monitoring infrastructure
- Disaster recovery drill
- Performance optimization review
- Update monitoring documentation

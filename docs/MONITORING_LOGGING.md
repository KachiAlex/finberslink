# Monitoring & Logging Setup Guide

## Overview

Comprehensive monitoring and logging strategy for production Finbers-Link application.

---

## Logging Strategy

### Log Levels

```
ERROR   - Critical errors requiring immediate attention
WARN    - Warnings that may indicate issues
INFO    - General informational messages
DEBUG   - Detailed debugging information (development only)
TRACE   - Very detailed trace information (development only)
```

### Log Categories

#### Application Logs
- Request/response logging
- Authentication events
- Business logic errors
- Performance metrics
- User actions

#### Database Logs
- Query performance
- Connection pool status
- Migration events
- Data integrity issues
- Slow queries

#### Infrastructure Logs
- Server health
- Memory usage
- Disk usage
- Network issues
- Deployment events

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "service": "finberslink",
  "environment": "production",
  "requestId": "req-12345",
  "userId": "user-456",
  "message": "Database connection failed",
  "error": {
    "name": "DatabaseError",
    "message": "Connection timeout",
    "stack": "..."
  },
  "context": {
    "endpoint": "/api/jobs",
    "method": "GET",
    "statusCode": 500,
    "duration": 5000
  }
}
```

---

## Application Logging Implementation

### Winston Logger Setup

```typescript
// src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'finberslink',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File output
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export default logger;
```

### Request Logging Middleware

```typescript
// src/lib/middleware/request-logger.ts
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function requestLogger(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const response = await handler(request);
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      statusCode: response.status,
      duration,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Request failed', {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}
```

### Error Logging

```typescript
// src/lib/error-logger.ts
import logger from '@/lib/logger';

export function logError(
  error: unknown,
  context: Record<string, any> = {}
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  logger.error('Application error', {
    name: errorObj.name,
    message: errorObj.message,
    stack: errorObj.stack,
    ...context,
  });
}

export function logWarning(
  message: string,
  context: Record<string, any> = {}
) {
  logger.warn(message, context);
}

export function logInfo(
  message: string,
  context: Record<string, any> = {}
) {
  logger.info(message, context);
}
```

---

## Log Aggregation

### CloudWatch (AWS)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s
```

### CloudWatch Configuration

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/finberslink/error.log",
            "log_group_name": "/aws/finberslink/error",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/finberslink/combined.log",
            "log_group_name": "/aws/finberslink/combined",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/postgresql/postgresql.log",
            "log_group_name": "/aws/finberslink/database",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
```

### CloudWatch Queries

```sql
-- Find errors in last hour
fields @timestamp, @message, @logStream
| filter @message like /ERROR/
| stats count() by @logStream

-- API response times
fields @duration
| filter @message like /Request completed/
| stats avg(@duration), max(@duration), pct(@duration, 95)

-- Database query performance
fields @duration
| filter @message like /Query executed/
| stats avg(@duration), max(@duration), pct(@duration, 99)

-- Authentication failures
fields @timestamp, @message, userId
| filter @message like /Authentication failed/
| stats count() by userId
```

### Datadog Integration

```bash
# Install Datadog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=$DATADOG_API_KEY \
  DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"

# Configure for Node.js
npm install --save dd-trace

# Initialize in application
const tracer = require('dd-trace').init();
```

---

## Monitoring Setup

### Key Metrics

#### Application Metrics
- Request count
- Response time (p50, p95, p99)
- Error rate
- Authentication success rate
- API endpoint usage

#### Database Metrics
- Query execution time
- Connection pool usage
- Slow query count
- Transaction duration
- Replication lag

#### Infrastructure Metrics
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Process count

#### Business Metrics
- User registrations
- Job applications
- Course enrollments
- Active users
- Feature usage

### Prometheus Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'finberslink'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'

  - job_name: 'postgresql'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

### Grafana Dashboards

#### Application Dashboard
```json
{
  "dashboard": {
    "title": "Finberslink Application",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~'5..'}[5m])"
          }
        ]
      }
    ]
  }
}
```

#### Database Dashboard
```json
{
  "dashboard": {
    "title": "PostgreSQL Database",
    "panels": [
      {
        "title": "Query Time",
        "targets": [
          {
            "expr": "rate(pg_stat_statements_mean_time[5m])"
          }
        ]
      },
      {
        "title": "Connection Count",
        "targets": [
          {
            "expr": "pg_stat_activity_count"
          }
        ]
      },
      {
        "title": "Cache Hit Ratio",
        "targets": [
          {
            "expr": "pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)"
          }
        ]
      }
    ]
  }
}
```

---

## Alerting

### Alert Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: finberslink
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~'5..'}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 5
        for: 5m
        annotations:
          summary: "High response time detected"
          description: "p95 response time is {{ $value }}s"

      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 90
        for: 2m
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value }} connections in use"

      # Disk space low
      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
        for: 5m
        annotations:
          summary: "Low disk space"
          description: "Only {{ $value | humanizePercentage }} disk space available"

      # Memory usage high
      - alert: HighMemoryUsage
        expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.1
        for: 5m
        annotations:
          summary: "High memory usage"
          description: "Only {{ $value | humanizePercentage }} memory available"
```

### Alert Notifications

#### Slack Integration
```bash
# Configure Alertmanager for Slack
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  receiver: 'slack'
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

receivers:
  - name: 'slack'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

#### Email Integration
```bash
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'app-password'
  smtp_from: 'alerts@example.com'

receivers:
  - name: 'email'
    email_configs:
      - to: 'ops@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.gmail.com:587'
```

#### PagerDuty Integration
```bash
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'
        description: '{{ .GroupLabels.alertname }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
```

---

## Health Checks

### Application Health Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check external services
    const openaiCheck = await checkOpenAI();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        openai: openaiCheck ? 'ok' : 'degraded',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

async function checkOpenAI(): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### Health Check Monitoring

```bash
# Monitor health endpoint
curl -f http://localhost:3000/api/health || exit 1

# Add to crontab for continuous monitoring
* * * * * curl -f http://localhost:3000/api/health || mail -s "Health check failed" admin@example.com
```

---

## Performance Monitoring

### Database Query Monitoring

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Clear statistics
SELECT pg_stat_statements_reset();
```

### Application Performance Monitoring (APM)

```typescript
// src/lib/apm.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});
```

---

## Log Retention Policy

| Log Type | Retention | Storage |
|----------|-----------|---------|
| Error logs | 90 days | CloudWatch |
| Application logs | 30 days | CloudWatch |
| Database logs | 30 days | CloudWatch |
| Access logs | 7 days | S3 |
| Audit logs | 1 year | S3 Glacier |

---

## Monitoring Checklist

### Daily
- [ ] Check error rate
- [ ] Review critical alerts
- [ ] Monitor response times
- [ ] Check database health
- [ ] Verify backups

### Weekly
- [ ] Review performance trends
- [ ] Analyze slow queries
- [ ] Check resource usage
- [ ] Review user metrics
- [ ] Update dashboards

### Monthly
- [ ] Capacity planning review
- [ ] Cost analysis
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation update

---

## Contacts & Escalation

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Engineer | [Name] | [Phone] | [Email] |
| Database Admin | [Name] | [Phone] | [Email] |
| DevOps Lead | [Name] | [Phone] | [Email] |
| CTO | [Name] | [Phone] | [Email] |

---

**Last Updated**: March 1, 2024
**Next Review**: April 1, 2024
**Status**: Active

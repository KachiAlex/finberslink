# Resume Features Deployment Guide

## Pre-Deployment Checklist

### Environment Setup

- [ ] All environment variables configured in `.env.production`
- [ ] Database credentials secured in secrets manager
- [ ] OpenAI API key configured
- [ ] AWS S3 credentials configured
- [ ] Redis connection string configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured

### Code Quality

- [ ] All tests passing (`npm run test`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] Code coverage at least 80%
- [ ] No security vulnerabilities (`npm audit`)

### Database

- [ ] Database migrations reviewed
- [ ] Backup created before migration
- [ ] Rollback procedure documented
- [ ] Connection pool settings optimized
- [ ] Indexes created and verified

### External Services

- [ ] OpenAI API quota verified
- [ ] S3 bucket created and configured
- [ ] CloudFront distribution created
- [ ] Redis cluster configured
- [ ] Bull queue configured

### Documentation

- [ ] API documentation updated
- [ ] Deployment runbook created
- [ ] Rollback procedures documented
- [ ] Monitoring alerts configured
- [ ] On-call procedures established

---

## Deployment Steps

### Phase 1: Database Migration

#### 1.1 Create Database Backup

```bash
# Backup production database
pg_dump -U postgres -h prod-db.rds.amazonaws.com finberslink > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

#### 1.2 Run Prisma Migrations

```bash
# In staging environment first
npm run prisma:migrate:deploy

# Verify migration
npm run prisma:validate

# In production
npm run prisma:migrate:deploy
```

#### 1.3 Verify Schema

```bash
# Check new tables exist
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "\dt"

# Verify indexes
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "\di"
```

### Phase 2: Infrastructure Setup

#### 2.1 Configure AWS S3

```bash
# Create S3 bucket for PDFs
aws s3 mb s3://finberslink-resumes-prod

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket finberslink-resumes-prod \
  --versioning-configuration Status=Enabled

# Set lifecycle policy (delete old versions after 30 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket finberslink-resumes-prod \
  --lifecycle-configuration file://lifecycle.json

# Configure CORS
aws s3api put-bucket-cors \
  --bucket finberslink-resumes-prod \
  --cors-configuration file://cors.json

# Block public access
aws s3api put-public-access-block \
  --bucket finberslink-resumes-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### 2.2 Configure CloudFront Distribution

```bash
# Create CloudFront distribution for S3
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Verify distribution
aws cloudfront list-distributions
```

#### 2.3 Configure Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id finberslink-redis-prod \
  --cache-node-type cache.r6g.large \
  --engine redis \
  --num-cache-nodes 3 \
  --automatic-failover-enabled

# Verify cluster
aws elasticache describe-cache-clusters \
  --cache-cluster-id finberslink-redis-prod
```

#### 2.4 Configure Bull Queue

```bash
# Verify Redis connection
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com ping

# Create queue
npm run queue:init
```

### Phase 3: Application Deployment

#### 3.1 Build Application

```bash
# Install dependencies
npm ci

# Build application
npm run build

# Verify build
ls -la .next/
```

#### 3.2 Deploy to Vercel

```bash
# Deploy to production
vercel deploy --prod

# Verify deployment
curl https://finberslink.com/api/health
```

#### 3.3 Deploy to Docker (Alternative)

```bash
# Build Docker image
docker build -t finberslink:latest .

# Push to registry
docker push finberslink:latest

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml

# Verify deployment
kubectl get pods -l app=finberslink
```

### Phase 4: Service Initialization

#### 4.1 Initialize PDF Service

```bash
# Test PDF generation
curl -X POST https://finberslink.com/api/resume/export \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "test_resume",
    "template": "Modern"
  }'
```

#### 4.2 Initialize AI Service

```bash
# Test AI suggestions
curl -X POST https://finberslink.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "test_resume",
    "analysisType": "full"
  }'
```

#### 4.3 Initialize Analytics Service

```bash
# Test event recording
curl -X POST https://finberslink.com/api/resume/analytics/events \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "test_resume",
    "eventType": "view",
    "metadata": {}
  }'

# Test analytics retrieval
curl -X GET https://finberslink.com/api/resume/analytics/test_resume \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 4.4 Initialize Publishing Service

```bash
# Test resume publication
curl -X POST https://finberslink.com/api/resume/publish \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "test_resume",
    "publish": true
  }'
```

### Phase 5: Monitoring and Verification

#### 5.1 Health Checks

```bash
# Check API health
curl https://finberslink.com/api/health

# Check database connection
npm run db:health

# Check Redis connection
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com ping

# Check S3 access
aws s3 ls s3://finberslink-resumes-prod/
```

#### 5.2 Performance Monitoring

```bash
# Monitor API response times
npm run monitor:api

# Monitor database queries
npm run monitor:db

# Monitor Redis usage
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com info stats
```

#### 5.3 Error Monitoring

```bash
# Check error logs
npm run logs:errors

# Check Sentry dashboard
# https://sentry.io/organizations/finberslink/issues/

# Check application logs
kubectl logs -l app=finberslink --tail=100
```

---

## Rollback Procedures

### Quick Rollback (Last 5 Minutes)

```bash
# Revert to previous deployment
vercel rollback

# Or manually
git revert HEAD
npm run build
vercel deploy --prod
```

### Database Rollback

```bash
# Restore from backup
psql -U postgres -h prod-db.rds.amazonaws.com finberslink < backup_20240328_143000.sql

# Verify restoration
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "SELECT COUNT(*) FROM Resume;"
```

### Full Rollback

```bash
# 1. Stop current deployment
kubectl scale deployment finberslink --replicas=0

# 2. Restore database
psql -U postgres -h prod-db.rds.amazonaws.com finberslink < backup_20240328_143000.sql

# 3. Revert code
git checkout previous-stable-tag
npm run build

# 4. Redeploy
vercel deploy --prod

# 5. Verify
curl https://finberslink.com/api/health
```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/finberslink

# Redis
REDIS_URL=redis://host:6379

# OpenAI
OPENAI_API_KEY=sk-...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=finberslink-resumes-prod

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://finberslink.com/api
JWT_SECRET=...

# Monitoring
SENTRY_DSN=...
LOG_LEVEL=info
```

### Optional Variables

```bash
# PDF Generation
PDF_TIMEOUT=30000
PDF_POOL_SIZE=5

# AI Service
AI_RATE_LIMIT=10
AI_CACHE_TTL=86400

# Analytics
ANALYTICS_BATCH_SIZE=100
ANALYTICS_BATCH_INTERVAL=5000

# Publishing
DISCOVERY_INDEX_TYPE=elasticsearch
DISCOVERY_INDEX_URL=...
```

---

## Monitoring Setup

### Sentry Configuration

```typescript
// sentry.server.config.ts
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

### CloudWatch Metrics

```typescript
// monitoring/metrics.ts
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

export async function recordMetric(
  metricName: string,
  value: number,
  unit: string = 'Count'
) {
  await cloudwatch.putMetricData({
    Namespace: 'FinbersLink/ResumeFeatures',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
      },
    ],
  }).promise();
}
```

### Alerting Rules

```yaml
# CloudWatch Alarms
- MetricName: APIErrorRate
  Threshold: 5
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - arn:aws:sns:us-east-1:123456789:alerts

- MetricName: PDFGenerationTime
  Threshold: 30000
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - arn:aws:sns:us-east-1:123456789:alerts

- MetricName: DatabaseConnectionPoolUsage
  Threshold: 80
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - arn:aws:sns:us-east-1:123456789:alerts
```

---

## Post-Deployment Verification

### Functional Testing

```bash
# Test PDF export
npm run test:pdf-export

# Test AI suggestions
npm run test:ai-suggestions

# Test analytics
npm run test:analytics

# Test publishing
npm run test:publishing
```

### Performance Testing

```bash
# Load test API endpoints
npm run test:load

# Expected results:
# - PDF export: < 5 seconds
# - Analytics query: < 500ms
# - AI suggestions: < 30 seconds
# - Public resume view: < 2 seconds
```

### Security Testing

```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm run security:check

# Verify authentication
npm run test:auth

# Verify authorization
npm run test:authz
```

---

## Troubleshooting

### Common Issues

#### Issue: PDF Generation Timeout

**Symptoms**: PDF export requests timeout after 30 seconds

**Solution**:
```bash
# Check Puppeteer pool
npm run debug:puppeteer-pool

# Increase pool size
PDF_POOL_SIZE=10 npm run start

# Check S3 connectivity
aws s3 ls s3://finberslink-resumes-prod/
```

#### Issue: AI Service Rate Limit

**Symptoms**: AI suggestion requests return 429 error

**Solution**:
```bash
# Check OpenAI quota
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Increase rate limit
AI_RATE_LIMIT=20 npm run start

# Check cache
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com keys "suggestions:*"
```

#### Issue: Analytics Events Not Recording

**Symptoms**: Analytics dashboard shows no data

**Solution**:
```bash
# Check Bull queue
npm run debug:queue

# Check Redis connection
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com ping

# Check database
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "SELECT COUNT(*) FROM ResumeAnalytics;"

# Restart queue processor
npm run queue:restart
```

#### Issue: Publishing Service Not Working

**Symptoms**: Resume publication fails

**Solution**:
```bash
# Check database
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "SELECT * FROM ResumePublishing LIMIT 1;"

# Check discovery index
curl -X GET http://elasticsearch:9200/resumes/_count

# Verify public URL generation
npm run debug:publishing
```

---

## Maintenance Tasks

### Daily Tasks

- [ ] Monitor error logs
- [ ] Check API response times
- [ ] Verify database backups
- [ ] Monitor Redis memory usage

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Analyze analytics data
- [ ] Review cost reports

### Monthly Tasks

- [ ] Archive old analytics data
- [ ] Optimize database indexes
- [ ] Review and update documentation
- [ ] Conduct security audit

### Quarterly Tasks

- [ ] Capacity planning review
- [ ] Disaster recovery drill
- [ ] Security penetration testing
- [ ] Performance optimization review

---

## Support and Escalation

### On-Call Procedures

1. **Alert Received**: Check Sentry/CloudWatch dashboard
2. **Assess Severity**: Determine impact and urgency
3. **Investigate**: Check logs, metrics, and services
4. **Mitigate**: Apply quick fix or rollback
5. **Communicate**: Update status page and stakeholders
6. **Resolve**: Implement permanent fix
7. **Post-Mortem**: Document incident and lessons learned

### Escalation Path

- **Level 1**: On-call engineer (first 15 minutes)
- **Level 2**: Senior engineer (if not resolved in 15 minutes)
- **Level 3**: Engineering manager (if not resolved in 30 minutes)
- **Level 4**: VP Engineering (if not resolved in 1 hour)

### Contact Information

- **On-Call Slack**: #finberslink-oncall
- **Incident Channel**: #incidents
- **Engineering Lead**: @engineering-lead
- **VP Engineering**: @vp-engineering


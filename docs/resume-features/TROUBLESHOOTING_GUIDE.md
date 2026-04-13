# Resume Features Troubleshooting Guide

## Quick Diagnostics

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "=== Resume Features Health Check ==="
echo ""

# Check API
echo "1. Checking API..."
curl -s https://finberslink.com/api/health | jq .

# Check Database
echo "2. Checking Database..."
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "SELECT COUNT(*) FROM Resume;" 2>&1

# Check Redis
echo "3. Checking Redis..."
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com ping

# Check S3
echo "4. Checking S3..."
aws s3 ls s3://finberslink-resumes-prod/ --max-items 1

# Check OpenAI
echo "5. Checking OpenAI API..."
curl -s https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data | length'

echo ""
echo "=== Health Check Complete ==="
```

---

## PDF Export Issues

### Issue 1: PDF Generation Timeout

**Error Message**: `504 Gateway Timeout` or `GENERATION_TIMEOUT`

**Symptoms**:
- PDF export requests timeout after 30 seconds
- Error appears in Sentry
- No PDF file created

**Root Causes**:
1. Puppeteer pool exhausted
2. Resume data too large
3. Network latency to S3
4. Insufficient server resources

**Diagnosis**:
```bash
# Check Puppeteer pool status
npm run debug:puppeteer-pool

# Check server resources
top -b -n 1 | head -20

# Check network latency to S3
ping s3.amazonaws.com

# Check resume size
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT id, pg_size_pretty(pg_column_size(data)) FROM Resume WHERE id = 'resume_123';"
```

**Solutions**:

1. **Increase Puppeteer Pool Size**:
```bash
# Update environment variable
PDF_POOL_SIZE=10 npm run start

# Or update .env.production
echo "PDF_POOL_SIZE=10" >> .env.production
```

2. **Optimize Resume Data**:
```typescript
// Remove unnecessary fields before PDF generation
const optimizedResume = {
  summary: resume.summary,
  experience: resume.experience,
  education: resume.education,
  skills: resume.skills,
  projects: resume.projects,
  // Exclude: metadata, timestamps, etc.
};
```

3. **Increase Timeout**:
```bash
# Update environment variable
PDF_TIMEOUT=60000 npm run start
```

4. **Scale Server Resources**:
```bash
# Increase instance size
kubectl set resources deployment finberslink \
  --limits=cpu=2,memory=4Gi \
  --requests=cpu=1,memory=2Gi
```

---

### Issue 2: PDF File Size Exceeded

**Error Message**: `413 FILE_SIZE_EXCEEDED`

**Symptoms**:
- PDF export fails for large resumes
- Error message indicates file size limit
- Works for smaller resumes

**Root Causes**:
1. Resume contains too many sections
2. Large images or attachments
3. Excessive formatting

**Diagnosis**:
```bash
# Check generated PDF size
ls -lh /tmp/resume_*.pdf

# Check resume content size
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT pg_size_pretty(pg_column_size(data)) FROM Resume WHERE id = 'resume_123';"
```

**Solutions**:

1. **Increase File Size Limit**:
```bash
# Update environment variable
MAX_PDF_SIZE=104857600 npm run start  # 100MB
```

2. **Optimize Resume Content**:
```typescript
// Remove unnecessary content
const optimizedResume = {
  ...resume,
  experience: resume.experience.slice(0, 10), // Limit to 10 entries
  projects: resume.projects.slice(0, 5),      // Limit to 5 projects
};
```

3. **Compress Images**:
```typescript
// Compress images before PDF generation
const compressImage = async (imageUrl) => {
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();
  const compressed = await sharp(buffer)
    .resize(200, 200)
    .jpeg({ quality: 80 })
    .toBuffer();
  return compressed.toString('base64');
};
```

---

### Issue 3: PDF Template Not Found

**Error Message**: `400 TEMPLATE_NOT_FOUND`

**Symptoms**:
- Template selection fails
- Error indicates template doesn't exist
- Works with other templates

**Root Causes**:
1. Template file missing
2. Template name misspelled
3. Template not deployed

**Diagnosis**:
```bash
# Check available templates
ls -la src/templates/

# Check template files
find . -name "*.html" -path "*/templates/*"

# Check template configuration
npm run debug:templates
```

**Solutions**:

1. **Verify Template Files Exist**:
```bash
# Create missing templates
mkdir -p src/templates
touch src/templates/Modern.html
touch src/templates/Classic.html
touch src/templates/Minimal.html
```

2. **Check Template Names**:
```typescript
// Verify template names match exactly
const VALID_TEMPLATES = ['Modern', 'Classic', 'Minimal'];

if (!VALID_TEMPLATES.includes(template)) {
  throw new Error(`Invalid template: ${template}`);
}
```

3. **Redeploy Application**:
```bash
npm run build
vercel deploy --prod
```

---

### Issue 4: S3 Upload Failure

**Error Message**: `500 INTERNAL_ERROR` with S3 error in logs

**Symptoms**:
- PDF generated but not saved
- Error in Sentry mentioning S3
- Download URL not returned

**Root Causes**:
1. S3 credentials invalid
2. S3 bucket doesn't exist
3. Insufficient permissions
4. Network connectivity issue

**Diagnosis**:
```bash
# Test S3 connectivity
aws s3 ls s3://finberslink-resumes-prod/

# Check S3 credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3api get-bucket-acl --bucket finberslink-resumes-prod

# Check bucket policy
aws s3api get-bucket-policy --bucket finberslink-resumes-prod
```

**Solutions**:

1. **Verify S3 Credentials**:
```bash
# Update environment variables
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
```

2. **Create S3 Bucket**:
```bash
aws s3 mb s3://finberslink-resumes-prod --region us-east-1
```

3. **Update Bucket Policy**:
```bash
aws s3api put-bucket-policy \
  --bucket finberslink-resumes-prod \
  --policy file://bucket-policy.json
```

4. **Test Upload**:
```bash
echo "test" > test.txt
aws s3 cp test.txt s3://finberslink-resumes-prod/
```

---

## AI Suggestions Issues

### Issue 1: AI Service Rate Limit

**Error Message**: `429 RATE_LIMIT_EXCEEDED`

**Symptoms**:
- AI suggestion requests fail with 429 error
- Works after waiting a while
- Multiple users affected

**Root Causes**:
1. User exceeded rate limit (10 per hour)
2. OpenAI API quota exceeded
3. Rate limiter misconfigured

**Diagnosis**:
```bash
# Check rate limit status
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com \
  GET "ratelimit:user_123:ai_suggestions"

# Check OpenAI quota
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq .

# Check rate limit configuration
npm run debug:rate-limits
```

**Solutions**:

1. **Increase Rate Limit**:
```bash
# Update environment variable
AI_RATE_LIMIT=20 npm run start
```

2. **Upgrade OpenAI Plan**:
```bash
# Check current usage
curl https://api.openai.com/v1/usage/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Upgrade plan at https://platform.openai.com/account/billing/overview
```

3. **Implement Queue**:
```typescript
// Queue suggestions instead of immediate processing
const suggestionQueue = new Queue('suggestions');

suggestionQueue.process(async (job) => {
  const { resumeId, analysisType } = job.data;
  return await aiService.generateSuggestions(resumeId, analysisType);
});
```

---

### Issue 2: AI Service Unavailable

**Error Message**: `503 SERVICE_UNAVAILABLE`

**Symptoms**:
- AI suggestion requests fail
- Error mentions OpenAI API
- Works intermittently

**Root Causes**:
1. OpenAI API down
2. Network connectivity issue
3. API key invalid or expired

**Diagnosis**:
```bash
# Check OpenAI status
curl https://status.openai.com/api/v2/status.json

# Test OpenAI connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check API key validity
npm run debug:openai-key
```

**Solutions**:

1. **Wait for Service Recovery**:
```bash
# Monitor OpenAI status
watch -n 5 'curl -s https://status.openai.com/api/v2/status.json | jq .status.indicator'
```

2. **Verify API Key**:
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json"
```

3. **Implement Fallback**:
```typescript
// Fallback to cached suggestions if API unavailable
try {
  return await openaiService.generateSuggestions(resumeId);
} catch (error) {
  if (error.status === 503) {
    const cached = await redis.get(`suggestions:${resumeId}`);
    if (cached) return JSON.parse(cached);
  }
  throw error;
}
```

---

### Issue 3: Insufficient Resume Content

**Error Message**: `400 INSUFFICIENT_CONTENT`

**Symptoms**:
- AI suggestions fail for new/empty resumes
- Works for complete resumes
- Error message indicates not enough content

**Root Causes**:
1. Resume has minimal content
2. Required sections missing
3. Content validation too strict

**Diagnosis**:
```bash
# Check resume content
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT id, summary, experience, education FROM Resume WHERE id = 'resume_123';"

# Check content validation rules
npm run debug:content-validation
```

**Solutions**:

1. **Relax Content Requirements**:
```typescript
// Allow suggestions for resumes with minimal content
const MIN_CONTENT_LENGTH = 50; // characters

if (resume.summary.length < MIN_CONTENT_LENGTH) {
  return {
    suggestions: [],
    message: 'Resume needs more content for meaningful suggestions'
  };
}
```

2. **Provide Guidance**:
```typescript
// Return helpful message instead of error
return {
  error: 'INSUFFICIENT_CONTENT',
  message: 'Please add at least one experience entry to get suggestions',
  suggestions: []
};
```

---

## Analytics Issues

### Issue 1: Events Not Recording

**Error Message**: No error, but analytics dashboard shows no data

**Symptoms**:
- Analytics dashboard empty
- No view count
- No events in database

**Root Causes**:
1. Event recording endpoint not called
2. Bull queue not processing
3. Database connection issue
4. Events being dropped

**Diagnosis**:
```bash
# Check if events are being recorded
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT COUNT(*) FROM ResumeAnalytics WHERE resumeId = 'resume_123';"

# Check Bull queue
npm run debug:queue

# Check queue jobs
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com \
  LLEN "bull:analytics:*"

# Check for errors
npm run logs:errors | grep analytics
```

**Solutions**:

1. **Verify Event Recording Endpoint**:
```typescript
// Ensure endpoint is called on resume view
useEffect(() => {
  const recordView = async () => {
    await fetch('/api/resume/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeId: resume.id,
        eventType: 'view',
        metadata: { deviceType: 'desktop' }
      })
    });
  };
  recordView();
}, [resume.id]);
```

2. **Restart Queue Processor**:
```bash
npm run queue:restart

# Or manually
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com FLUSHDB
npm run queue:init
```

3. **Check Database Connection**:
```bash
# Test connection
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "SELECT 1;"

# Check connection pool
npm run debug:db-pool
```

---

### Issue 2: Analytics Query Slow

**Error Message**: `504 Gateway Timeout` on analytics endpoint

**Symptoms**:
- Analytics dashboard takes >5 seconds to load
- Timeout errors in logs
- Works for small date ranges

**Root Causes**:
1. Large date range query
2. Missing indexes
3. Database under load
4. Inefficient query

**Diagnosis**:
```bash
# Analyze query performance
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "EXPLAIN ANALYZE SELECT * FROM ResumeAnalytics WHERE resumeId = 'resume_123' AND createdAt > NOW() - INTERVAL '1 year';"

# Check index usage
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT * FROM pg_stat_user_indexes WHERE relname = 'ResumeAnalytics';"

# Check database load
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT datname, numbackends FROM pg_stat_database WHERE datname = 'finberslink';"
```

**Solutions**:

1. **Create Missing Indexes**:
```sql
CREATE INDEX idx_resumeId_createdAt ON ResumeAnalytics(resumeId, createdAt);
CREATE INDEX idx_eventType_createdAt ON ResumeAnalytics(eventType, createdAt);
```

2. **Optimize Query**:
```typescript
// Use date range filtering
const analytics = await prisma.resumeAnalytics.findMany({
  where: {
    resumeId: 'resume_123',
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      lte: new Date()
    }
  },
  take: 1000 // Limit results
});
```

3. **Cache Results**:
```typescript
// Cache analytics for 1 hour
const cacheKey = `analytics:${resumeId}:${startDate}:${endDate}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const analytics = await getAnalytics(resumeId, startDate, endDate);
await redis.setex(cacheKey, 3600, JSON.stringify(analytics));
return analytics;
```

4. **Archive Old Data**:
```bash
# Archive analytics older than 1 year
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "INSERT INTO ResumeAnalytics_Archive SELECT * FROM ResumeAnalytics WHERE createdAt < NOW() - INTERVAL '1 year';"

psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "DELETE FROM ResumeAnalytics WHERE createdAt < NOW() - INTERVAL '1 year';"
```

---

### Issue 3: Incorrect Metrics

**Error Message**: No error, but metrics don't match expected values

**Symptoms**:
- View count doesn't match actual views
- Ratios are incorrect
- Section engagement percentages don't sum to 100%

**Root Causes**:
1. Aggregation logic error
2. Duplicate events
3. Data corruption
4. Calculation error

**Diagnosis**:
```bash
# Check raw events
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT eventType, COUNT(*) FROM ResumeAnalytics WHERE resumeId = 'resume_123' GROUP BY eventType;"

# Check for duplicates
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT id, COUNT(*) FROM ResumeAnalytics WHERE resumeId = 'resume_123' GROUP BY id HAVING COUNT(*) > 1;"

# Check section engagement
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT sectionName, SUM(engagementPercentage) FROM ResumeSectionEngagement WHERE resumeId = 'resume_123' GROUP BY resumeId;"
```

**Solutions**:

1. **Fix Aggregation Logic**:
```typescript
// Ensure correct calculation
const totalViews = events.filter(e => e.eventType === 'view').length;
const totalDownloads = events.filter(e => e.eventType === 'download').length;
const ratio = totalViews > 0 ? totalDownloads / totalViews : 0;
```

2. **Remove Duplicates**:
```sql
-- Remove duplicate events
DELETE FROM ResumeAnalytics a
WHERE a.id NOT IN (
  SELECT MIN(id) FROM ResumeAnalytics
  GROUP BY resumeId, eventType, createdAt
);
```

3. **Recalculate Metrics**:
```bash
npm run analytics:recalculate --resumeId=resume_123
```

---

## Publishing Issues

### Issue 1: Resume Not Publishing

**Error Message**: `500 INTERNAL_ERROR` or no response

**Symptoms**:
- Publish button doesn't work
- No error message displayed
- Resume remains unpublished

**Root Causes**:
1. Database error
2. Public ID generation failed
3. Discovery index error
4. Permission issue

**Diagnosis**:
```bash
# Check database
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT * FROM ResumePublishing WHERE resumeId = 'resume_123';"

# Check for errors
npm run logs:errors | grep publish

# Check permissions
npm run debug:permissions --resumeId=resume_123
```

**Solutions**:

1. **Verify Database**:
```bash
# Ensure ResumePublishing table exists
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c "\dt ResumePublishing"

# Create record if missing
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "INSERT INTO ResumePublishing (resumeId, publicId, published) VALUES ('resume_123', 'pub_xyz', false);"
```

2. **Check Public ID Generation**:
```typescript
// Ensure UUID generation works
import { v4 as uuidv4 } from 'uuid';
const publicId = uuidv4();
console.log('Generated public ID:', publicId);
```

3. **Verify Permissions**:
```typescript
// Ensure user owns resume
const resume = await prisma.resume.findUnique({
  where: { id: resumeId }
});

if (resume.userId !== currentUser.id) {
  throw new Error('Unauthorized');
}
```

---

### Issue 2: Public URL Not Accessible

**Error Message**: `404 NOT_FOUND` when accessing public URL

**Symptoms**:
- Resume published successfully
- Public URL generated
- URL returns 404 error

**Root Causes**:
1. Public endpoint not deployed
2. Route not configured
3. Resume data not found
4. Resume unpublished

**Diagnosis**:
```bash
# Test public endpoint
curl https://finberslink.com/public/resumes/pub_xyz789

# Check route configuration
grep -r "public/resumes" src/app/

# Check database
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT * FROM ResumePublishing WHERE publicId = 'pub_xyz789';"
```

**Solutions**:

1. **Create Public Endpoint**:
```typescript
// src/app/api/public/resumes/[publicId]/route.ts
export async function GET(req, { params }) {
  const { publicId } = params;
  
  const publishing = await prisma.resumePublishing.findUnique({
    where: { publicId },
    include: { resume: true }
  });
  
  if (!publishing || !publishing.published) {
    return new Response('Not found', { status: 404 });
  }
  
  return Response.json(publishing.resume);
}
```

2. **Verify Route Configuration**:
```bash
# Check Next.js routing
npm run build
grep -r "public/resumes" .next/

# Test route
curl http://localhost:3000/public/resumes/pub_xyz789
```

---

### Issue 3: Discovery Search Not Working

**Error Message**: `500 INTERNAL_ERROR` or no results

**Symptoms**:
- Search endpoint returns error
- No results returned
- Search filters don't work

**Root Causes**:
1. Elasticsearch not configured
2. Discovery index empty
3. Search query malformed
4. Filter validation error

**Diagnosis**:
```bash
# Check Elasticsearch
curl http://elasticsearch:9200/_cluster/health

# Check index
curl http://elasticsearch:9200/resumes/_count

# Check index mapping
curl http://elasticsearch:9200/resumes/_mapping
```

**Solutions**:

1. **Initialize Elasticsearch**:
```bash
# Create index
curl -X PUT http://elasticsearch:9200/resumes

# Create mapping
curl -X PUT http://elasticsearch:9200/resumes/_mapping -d @mapping.json
```

2. **Rebuild Discovery Index**:
```bash
npm run discovery:rebuild

# Or manually
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT * FROM ResumePublishing WHERE published = true;" | \
  xargs -I {} curl -X POST http://elasticsearch:9200/resumes/_doc -d {}
```

3. **Verify Search Query**:
```typescript
// Test search
const results = await elasticsearchClient.search({
  index: 'resumes',
  body: {
    query: {
      multi_match: {
        query: 'software engineer',
        fields: ['summary', 'skills', 'targetRoles']
      }
    }
  }
});
```

---

## Database Issues

### Issue 1: Connection Pool Exhausted

**Error Message**: `ECONNREFUSED` or `connection timeout`

**Symptoms**:
- All API requests fail
- Database connection errors
- Application becomes unresponsive

**Root Causes**:
1. Too many concurrent connections
2. Connections not being released
3. Database server down
4. Network connectivity issue

**Diagnosis**:
```bash
# Check active connections
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT datname, numbackends FROM pg_stat_database WHERE datname = 'finberslink';"

# Check connection pool
npm run debug:db-pool

# Check database server
ping prod-db.rds.amazonaws.com
```

**Solutions**:

1. **Increase Connection Pool**:
```bash
# Update DATABASE_URL
DATABASE_URL="postgresql://user:password@host:5432/finberslink?connection_limit=30"
```

2. **Restart Application**:
```bash
npm run restart
```

3. **Check Database Server**:
```bash
# Restart database
aws rds reboot-db-instance --db-instance-identifier finberslink-prod

# Monitor restart
aws rds describe-db-instances --db-instance-identifier finberslink-prod
```

---

### Issue 2: Slow Queries

**Error Message**: Queries taking >1 second

**Symptoms**:
- API responses slow
- Database CPU high
- Timeout errors

**Root Causes**:
1. Missing indexes
2. Large table scans
3. Complex joins
4. Database under load

**Diagnosis**:
```bash
# Enable slow query log
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Check slow queries
psql -U postgres -h prod-db.rds.amazonaws.com finberslink -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Solutions**:

1. **Create Indexes**:
```sql
CREATE INDEX idx_resumeId_createdAt ON ResumeAnalytics(resumeId, createdAt);
ANALYZE ResumeAnalytics;
```

2. **Optimize Queries**:
```typescript
// Use select to limit columns
const analytics = await prisma.resumeAnalytics.findMany({
  select: { id: true, eventType: true, createdAt: true },
  where: { resumeId: 'resume_123' }
});
```

---

## Redis Issues

### Issue 1: Redis Connection Failed

**Error Message**: `ECONNREFUSED` or `connection timeout`

**Symptoms**:
- Cache not working
- API requests slow
- Redis errors in logs

**Root Causes**:
1. Redis server down
2. Network connectivity issue
3. Credentials invalid
4. Port misconfigured

**Diagnosis**:
```bash
# Test Redis connection
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com ping

# Check Redis status
redis-cli -h finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com info server

# Check network
ping finberslink-redis-prod.xxxxx.ng.0001.use1.cache.amazonaws.com
```

**Solutions**:

1. **Restart Redis**:
```bash
aws elasticache reboot-cache-cluster \
  --cache-cluster-id finberslink-redis-prod
```

2. **Verify Credentials**:
```bash
# Update REDIS_URL
REDIS_URL="redis://user:password@host:6379"
```

---

## General Troubleshooting

### Enable Debug Logging

```bash
# Set log level to debug
LOG_LEVEL=debug npm run start

# Or in .env.production
LOG_LEVEL=debug
```

### Check Application Logs

```bash
# View recent logs
npm run logs:recent

# View error logs
npm run logs:errors

# View specific service logs
npm run logs:service --service=pdf-export
```

### Monitor System Resources

```bash
# CPU and memory
top -b -n 1

# Disk usage
df -h

# Network connections
netstat -an | grep ESTABLISHED | wc -l
```

### Restart Services

```bash
# Restart application
npm run restart

# Restart queue processor
npm run queue:restart

# Restart all services
docker-compose restart
```

### Contact Support

If issues persist:
1. Collect logs and diagnostics
2. Document steps to reproduce
3. Contact engineering team
4. Escalate if critical


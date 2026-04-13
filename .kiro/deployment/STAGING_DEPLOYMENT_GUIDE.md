# Staging Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Resume Features Completion to the staging environment for comprehensive testing before production deployment.

## Pre-Deployment Setup

### Environment Preparation
1. Ensure staging environment is available and healthy
2. Verify staging database is backed up
3. Verify staging Redis instance is available
4. Verify staging S3 bucket is configured
5. Verify staging OpenAI API keys are configured
6. Verify staging environment variables are set

### Code Preparation
1. Ensure all code is committed to git
2. Ensure all tests pass locally
3. Ensure code review is complete
4. Ensure all dependencies are updated
5. Create deployment tag: `git tag -a v1.0.0-staging -m "Staging deployment"`

## Deployment Steps

### Step 1: Deploy to Staging Environment

```bash
# Navigate to project directory
cd /path/to/project

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run database migrations in staging
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# Deploy to staging
npm run deploy:staging

# Verify deployment
curl https://staging-api.example.com/health
```

### Step 2: Verify Database Schema

```bash
# Check database schema
DATABASE_URL=$STAGING_DATABASE_URL npx prisma db push --skip-generate

# Verify tables exist
DATABASE_URL=$STAGING_DATABASE_URL npx prisma db execute --stdin << EOF
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ResumeAnalytics', 'ResumeSuggestion', 'ResumePublishing', 'ResumeSectionEngagement');
EOF

# Verify indexes exist
DATABASE_URL=$STAGING_DATABASE_URL npx prisma db execute --stdin << EOF
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('ResumeAnalytics', 'ResumeSuggestion', 'ResumePublishing', 'ResumeSectionEngagement');
EOF
```

### Step 3: Verify API Endpoints

```bash
# Test health endpoint
curl https://staging-api.example.com/health

# Test PDF export endpoint
curl -X POST https://staging-api.example.com/api/resume/export \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resumeId": "test-resume", "template": "Modern"}'

# Test analytics endpoint
curl https://staging-api.example.com/api/resume/analytics/test-resume \
  -H "Authorization: Bearer $STAGING_TOKEN"

# Test publishing endpoint
curl -X POST https://staging-api.example.com/api/resume/publish \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resumeId": "test-resume", "publish": true}'

# Test AI suggestions endpoint
curl -X POST https://staging-api.example.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resumeId": "test-resume"}'
```

### Step 4: Run Smoke Tests

```bash
# Run smoke tests
npm run test:smoke

# Check results
if [ $? -eq 0 ]; then
  echo "Smoke tests passed"
else
  echo "Smoke tests failed"
  exit 1
fi
```

## Functional Testing

### PDF Export Testing

#### Test Case 1: Export with Modern Template
```bash
# Create test resume
TEST_RESUME_ID=$(curl -X POST https://staging-api.example.com/api/resumes \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "summary": "Experienced software engineer",
    "experience": [{
      "company": "Tech Corp",
      "position": "Senior Engineer",
      "startDate": "2020-01-01",
      "endDate": "2023-12-31",
      "description": "Led team of 5 engineers"
    }],
    "education": [{
      "school": "University",
      "degree": "BS Computer Science",
      "graduationDate": "2020-05-01"
    }],
    "skills": ["JavaScript", "TypeScript", "React", "Node.js"]
  }' | jq -r '.id')

# Export with Modern template
curl -X POST https://staging-api.example.com/api/resume/export \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"template\": \"Modern\"}" \
  -o /tmp/resume-modern.pdf

# Verify PDF was created
if [ -f /tmp/resume-modern.pdf ]; then
  echo "PDF export successful"
  file /tmp/resume-modern.pdf
else
  echo "PDF export failed"
  exit 1
fi
```

#### Test Case 2: Export with Classic Template
```bash
# Export with Classic template
curl -X POST https://staging-api.example.com/api/resume/export \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"template\": \"Classic\"}" \
  -o /tmp/resume-classic.pdf

# Verify PDF was created
if [ -f /tmp/resume-classic.pdf ]; then
  echo "PDF export successful"
else
  echo "PDF export failed"
  exit 1
fi
```

#### Test Case 3: Export with Minimal Template
```bash
# Export with Minimal template
curl -X POST https://staging-api.example.com/api/resume/export \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"template\": \"Minimal\"}" \
  -o /tmp/resume-minimal.pdf

# Verify PDF was created
if [ -f /tmp/resume-minimal.pdf ]; then
  echo "PDF export successful"
else
  echo "PDF export failed"
  exit 1
fi
```

### Analytics Testing

#### Test Case 1: Record View Event
```bash
# Record view event
curl -X POST https://staging-api.example.com/api/resume/analytics/events \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"resumeId\": \"$TEST_RESUME_ID\",
    \"eventType\": \"view\",
    \"metadata\": {
      \"deviceType\": \"desktop\",
      \"browser\": \"Chrome\",
      \"operatingSystem\": \"Windows\",
      \"country\": \"US\",
      \"city\": \"New York\"
    }
  }"

# Wait for event to be processed
sleep 5

# Verify event was recorded
curl https://staging-api.example.com/api/resume/analytics/$TEST_RESUME_ID \
  -H "Authorization: Bearer $STAGING_TOKEN" | jq '.summary.totalViews'
```

#### Test Case 2: Record Download Event
```bash
# Record download event
curl -X POST https://staging-api.example.com/api/resume/analytics/events \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"resumeId\": \"$TEST_RESUME_ID\",
    \"eventType\": \"download\",
    \"metadata\": {
      \"deviceType\": \"mobile\",
      \"browser\": \"Safari\",
      \"operatingSystem\": \"iOS\",
      \"country\": \"US\",
      \"city\": \"San Francisco\"
    }
  }"

# Wait for event to be processed
sleep 5

# Verify event was recorded
curl https://staging-api.example.com/api/resume/analytics/$TEST_RESUME_ID \
  -H "Authorization: Bearer $STAGING_TOKEN" | jq '.summary.totalDownloads'
```

#### Test Case 3: Record Share Event
```bash
# Record share event
curl -X POST https://staging-api.example.com/api/resume/analytics/events \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"resumeId\": \"$TEST_RESUME_ID\",
    \"eventType\": \"share\",
    \"metadata\": {
      \"shareMethod\": \"email\",
      \"deviceType\": \"desktop\",
      \"browser\": \"Firefox\",
      \"operatingSystem\": \"macOS\",
      \"country\": \"US\",
      \"city\": \"Seattle\"
    }
  }"

# Wait for event to be processed
sleep 5

# Verify event was recorded
curl https://staging-api.example.com/api/resume/analytics/$TEST_RESUME_ID \
  -H "Authorization: Bearer $STAGING_TOKEN" | jq '.summary.totalShares'
```

### AI Suggestions Testing

#### Test Case 1: Generate Suggestions
```bash
# Generate AI suggestions
curl -X POST https://staging-api.example.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\"}" | jq '.suggestions'

# Verify suggestions were generated
SUGGESTION_COUNT=$(curl -X POST https://staging-api.example.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\"}" | jq '.suggestions | length')

if [ $SUGGESTION_COUNT -gt 0 ]; then
  echo "Suggestions generated: $SUGGESTION_COUNT"
else
  echo "No suggestions generated"
fi
```

#### Test Case 2: Approve Suggestions
```bash
# Get suggestion IDs
SUGGESTION_IDS=$(curl -X POST https://staging-api.example.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\"}" | jq -r '.suggestions[0:2] | map(.id) | @json')

# Approve suggestions
curl -X POST https://staging-api.example.com/api/resume/ai/suggestions/approve \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"suggestionIds\": $SUGGESTION_IDS}"

# Verify suggestions were approved
echo "Suggestions approved"
```

### Publishing Testing

#### Test Case 1: Publish Resume
```bash
# Publish resume
PUBLISH_RESPONSE=$(curl -X POST https://staging-api.example.com/api/resume/publish \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"publish\": true}")

PUBLIC_URL=$(echo $PUBLISH_RESPONSE | jq -r '.publicUrl')
PUBLIC_ID=$(echo $PUBLISH_RESPONSE | jq -r '.publicId')

echo "Resume published at: $PUBLIC_URL"
echo "Public ID: $PUBLIC_ID"
```

#### Test Case 2: Access Public Resume
```bash
# Access public resume without authentication
curl https://staging-api.example.com/public/resumes/$PUBLIC_ID | jq '.resume'

# Verify resume is accessible
if [ $? -eq 0 ]; then
  echo "Public resume accessible"
else
  echo "Public resume not accessible"
  exit 1
fi
```

#### Test Case 3: Unpublish Resume
```bash
# Unpublish resume
curl -X POST https://staging-api.example.com/api/resume/publish \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"publish\": false}"

# Verify resume is no longer accessible
curl https://staging-api.example.com/public/resumes/$PUBLIC_ID
if [ $? -ne 0 ]; then
  echo "Resume successfully unpublished"
else
  echo "Resume still accessible after unpublish"
  exit 1
fi
```

## Load Testing

### Setup Load Testing Environment
```bash
# Install load testing tool (Apache JMeter or similar)
# Create test plan with following scenarios

# Scenario 1: PDF Export Load Test
# - 100 concurrent users
# - Each user exports 5 PDFs
# - Ramp-up time: 60 seconds
# - Duration: 5 minutes

# Scenario 2: Analytics Query Load Test
# - 500 concurrent users
# - Each user queries analytics 10 times
# - Ramp-up time: 60 seconds
# - Duration: 5 minutes

# Scenario 3: Public Resume Access Load Test
# - 1000 concurrent users
# - Each user accesses public resume 5 times
# - Ramp-up time: 60 seconds
# - Duration: 5 minutes
```

### Run Load Tests
```bash
# Run PDF export load test
jmeter -n -t pdf-export-load-test.jmx -l pdf-export-results.jtl

# Run analytics query load test
jmeter -n -t analytics-query-load-test.jmx -l analytics-query-results.jtl

# Run public resume access load test
jmeter -n -t public-resume-load-test.jmx -l public-resume-results.jtl

# Analyze results
# - Check response times (should be < 5 seconds for PDF, < 500ms for analytics)
# - Check error rates (should be < 1%)
# - Check throughput (should be > 100 RPS for analytics)
```

## Integration Testing

### Test Complete Workflows

#### Workflow 1: PDF Export → Analytics Tracking
```bash
# 1. Export PDF
curl -X POST https://staging-api.example.com/api/resume/export \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"template\": \"Modern\"}"

# 2. Verify export event was recorded
sleep 5
curl https://staging-api.example.com/api/resume/analytics/$TEST_RESUME_ID \
  -H "Authorization: Bearer $STAGING_TOKEN" | jq '.summary'
```

#### Workflow 2: AI Suggestions → Version Snapshot
```bash
# 1. Generate suggestions
curl -X POST https://staging-api.example.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\"}"

# 2. Approve suggestions
curl -X POST https://staging-api.example.com/api/resume/ai/suggestions/approve \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"suggestionIds\": [...]}"

# 3. Verify version snapshot was created
curl https://staging-api.example.com/api/resume/$TEST_RESUME_ID/versions \
  -H "Authorization: Bearer $STAGING_TOKEN" | jq '.versions'
```

#### Workflow 3: Publish → Public Access → View Tracking
```bash
# 1. Publish resume
curl -X POST https://staging-api.example.com/api/resume/publish \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$TEST_RESUME_ID\", \"publish\": true}"

# 2. Access public resume
curl https://staging-api.example.com/public/resumes/$PUBLIC_ID

# 3. Verify view was tracked
sleep 5
curl https://staging-api.example.com/api/resume/analytics/$TEST_RESUME_ID \
  -H "Authorization: Bearer $STAGING_TOKEN" | jq '.summary.totalViews'
```

## Verification Checklist

- [ ] All API endpoints responding correctly
- [ ] Database schema created successfully
- [ ] All indexes created
- [ ] PDF export working with all templates
- [ ] Analytics events being recorded
- [ ] Analytics queries returning correct data
- [ ] AI suggestions generating correctly
- [ ] Resume publishing working
- [ ] Public resume access working
- [ ] View tracking working
- [ ] All tests passing
- [ ] No error spikes in logs
- [ ] Performance metrics within acceptable range
- [ ] Load tests passing
- [ ] Integration tests passing

## Rollback from Staging

If issues are found during staging testing:

```bash
# Revert to previous version
git checkout $(git describe --tags --abbrev=0 HEAD~1)

# Rebuild and redeploy
npm run build
npm run deploy:staging

# Verify rollback
curl https://staging-api.example.com/health
```

## Sign-Off

- [ ] Development Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______

Once all verification steps are complete and signed off, proceed to production deployment.

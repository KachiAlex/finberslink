# Resume Features API Documentation

## Overview

This document provides comprehensive API documentation for the Resume Features Completion system, including all endpoints, request/response examples, error handling, and authentication requirements.

## Base URL

```
https://api.finberslink.com/api
```

All endpoints require authentication unless otherwise specified.

## Authentication

All authenticated endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Public endpoints (marked with 🔓) do not require authentication.

---

## PDF Export API

### Export Resume as PDF

**Endpoint:** `POST /resume/export`

**Authentication:** Required ✅

**Description:** Generate a PDF file from resume data with a selected template style.

**Request Body:**

```json
{
  "resumeId": "resume_123",
  "template": "Modern",
  "includeHeadshot": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resumeId` | string | Yes | Unique identifier of the resume to export |
| `template` | enum | Yes | Template style: `Modern`, `Classic`, or `Minimal` |
| `includeHeadshot` | boolean | No | Include profile photo in PDF (default: false) |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.finberslink.com/exports/john_doe_resume.pdf",
    "fileName": "john_doe_Resume.pdf",
    "fileSize": 245678,
    "generatedAt": "2024-01-15T10:30:00Z",
    "template": "Modern",
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `downloadUrl` | string | Direct download URL for the PDF file |
| `fileName` | string | Generated filename in format `{firstName}_{lastName}_Resume.pdf` |
| `fileSize` | number | Size of PDF in bytes |
| `generatedAt` | ISO8601 | Timestamp when PDF was generated |
| `template` | string | Template used for generation |
| `expiresAt` | ISO8601 | When the download link expires |

**Error Responses:**

```json
// 400 - Invalid Resume Data
{
  "success": false,
  "error": "Resume data is incomplete or invalid",
  "code": "INVALID_RESUME_DATA"
}

// 400 - Template Not Found
{
  "success": false,
  "error": "Selected template is not available",
  "code": "TEMPLATE_NOT_FOUND"
}

// 504 - PDF Generation Timeout
{
  "success": false,
  "error": "PDF generation took too long, please try again",
  "code": "PDF_GENERATION_TIMEOUT"
}

// 413 - File Size Exceeded
{
  "success": false,
  "error": "Generated PDF exceeds maximum file size (50MB)",
  "code": "FILE_SIZE_EXCEEDED"
}

// 403 - Access Denied
{
  "success": false,
  "error": "You don't have permission to export this resume",
  "code": "ACCESS_DENIED"
}
```

**Example cURL:**

```bash
curl -X POST https://api.finberslink.com/api/resume/export \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123",
    "template": "Modern",
    "includeHeadshot": true
  }'
```

---

## AI Suggestions API

### Generate AI Suggestions

**Endpoint:** `POST /resume/ai/suggestions`

**Authentication:** Required ✅

**Rate Limit:** 10 requests per hour per user

**Description:** Analyze resume content and generate improvement suggestions using AI.

**Request Body:**

```json
{
  "resumeId": "resume_123",
  "analysisType": "full"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resumeId` | string | Yes | Resume to analyze |
| `analysisType` | enum | No | Analysis scope: `full`, `summary`, `achievements`, `skills` (default: `full`) |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "sugg_001",
        "category": "summary",
        "originalText": "Experienced software engineer",
        "suggestedText": "Results-driven software engineer with 5+ years of experience building scalable web applications",
        "explanation": "Adding specific experience level and focus areas makes the summary more compelling",
        "confidenceLevel": "high",
        "targetField": "summary",
        "status": "pending"
      },
      {
        "id": "sugg_002",
        "category": "achievement",
        "originalText": "Improved system performance",
        "suggestedText": "Optimized database queries reducing API response time by 40%, improving user experience for 50,000+ daily active users",
        "explanation": "Using STAR method with quantifiable metrics makes achievements more impactful",
        "confidenceLevel": "high",
        "targetField": "experience[0].achievements[1]",
        "status": "pending"
      }
    ],
    "analysisMetadata": {
      "completedAt": "2024-01-15T10:35:00Z",
      "modelUsed": "gpt-4",
      "tokensUsed": 1250,
      "totalSuggestions": 2
    }
  }
}
```

**Suggestion Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique suggestion identifier |
| `category` | enum | Type: `summary`, `achievement`, `skill`, `experience` |
| `originalText` | string | Current text in resume |
| `suggestedText` | string | Proposed improved text |
| `explanation` | string | Reasoning for the suggestion |
| `confidenceLevel` | enum | `high`, `medium`, or `low` |
| `targetField` | string | Path to field in resume (e.g., `experience[0].achievements[1]`) |
| `status` | enum | `pending`, `approved`, or `rejected` |

**Error Responses:**

```json
// 429 - Rate Limit Exceeded
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}

// 503 - AI Service Unavailable
{
  "success": false,
  "error": "AI service is temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE"
}

// 400 - Invalid Resume Content
{
  "success": false,
  "error": "Resume content is not suitable for analysis",
  "code": "INVALID_CONTENT"
}

// 400 - Insufficient Content
{
  "success": false,
  "error": "Resume needs more content for meaningful suggestions",
  "code": "INSUFFICIENT_CONTENT"
}
```

**Example cURL:**

```bash
curl -X POST https://api.finberslink.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123",
    "analysisType": "full"
  }'
```

---

### Approve Suggestions

**Endpoint:** `POST /resume/ai/suggestions/approve`

**Authentication:** Required ✅

**Description:** Approve and apply selected suggestions to the resume.

**Request Body:**

```json
{
  "resumeId": "resume_123",
  "suggestionIds": ["sugg_001", "sugg_002"]
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resumeId` | string | Yes | Resume to update |
| `suggestionIds` | string[] | Yes | Array of suggestion IDs to approve |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "appliedCount": 2,
    "versionId": "v_456",
    "resumeUpdated": true,
    "snapshotCreated": true,
    "appliedAt": "2024-01-15T10:40:00Z"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `appliedCount` | number | Number of suggestions successfully applied |
| `versionId` | string | Version snapshot ID created before applying changes |
| `resumeUpdated` | boolean | Whether resume was successfully updated |
| `snapshotCreated` | boolean | Whether version snapshot was created |
| `appliedAt` | ISO8601 | Timestamp when suggestions were applied |

**Error Responses:**

```json
// 400 - Invalid Suggestions
{
  "success": false,
  "error": "One or more suggestions are invalid or already processed",
  "code": "INVALID_SUGGESTIONS"
}

// 403 - Access Denied
{
  "success": false,
  "error": "You don't have permission to modify this resume",
  "code": "ACCESS_DENIED"
}
```

**Example cURL:**

```bash
curl -X POST https://api.finberslink.com/api/resume/ai/suggestions/approve \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123",
    "suggestionIds": ["sugg_001", "sugg_002"]
  }'
```

---

### Reject Suggestions

**Endpoint:** `POST /resume/ai/suggestions/reject`

**Authentication:** Required ✅

**Description:** Reject selected suggestions without applying them.

**Request Body:**

```json
{
  "resumeId": "resume_123",
  "suggestionIds": ["sugg_003"]
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "rejectedCount": 1,
    "rejectedAt": "2024-01-15T10:42:00Z"
  }
}
```

---

## Analytics API

### Record Analytics Event

**Endpoint:** `POST /resume/analytics/events`

**Authentication:** Optional (can be called from public resume viewer)

**Description:** Record a view, download, or share event for analytics tracking.

**Request Body:**

```json
{
  "resumeId": "resume_123",
  "eventType": "view",
  "metadata": {
    "deviceType": "mobile",
    "browser": "Chrome",
    "operatingSystem": "iOS",
    "country": "US",
    "city": "San Francisco",
    "shareMethod": "email",
    "sectionEngagement": [
      {
        "sectionName": "experience",
        "timeSpentSeconds": 45,
        "scrollDepth": 85
      }
    ]
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resumeId` | string | Yes | Resume being viewed/downloaded/shared |
| `eventType` | enum | Yes | `view`, `download`, or `share` |
| `metadata` | object | No | Additional event metadata |

**Metadata Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `deviceType` | string | `desktop`, `mobile`, `tablet` |
| `browser` | string | Browser name (e.g., Chrome, Firefox, Safari) |
| `operatingSystem` | string | OS name (e.g., Windows, macOS, iOS, Android) |
| `country` | string | Country code (e.g., US, UK, CA) |
| `city` | string | City name |
| `shareMethod` | string | How resume was shared: `email`, `linkedin`, `twitter`, `facebook`, `link` |
| `sectionEngagement` | array | Array of section engagement data |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "eventId": "evt_789",
    "recorded": true,
    "timestamp": "2024-01-15T10:45:00Z"
  }
}
```

**Error Responses:**

```json
// 400 - Invalid Event Type
{
  "success": false,
  "error": "Invalid event type. Must be 'view', 'download', or 'share'",
  "code": "INVALID_EVENT_TYPE"
}

// 500 - Recording Failed
{
  "success": false,
  "error": "Failed to record event",
  "code": "RECORDING_FAILED"
}
```

**Example cURL:**

```bash
curl -X POST https://api.finberslink.com/api/resume/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123",
    "eventType": "view",
    "metadata": {
      "deviceType": "mobile",
      "browser": "Chrome",
      "country": "US"
    }
  }'
```

---

### Get Analytics Dashboard Data

**Endpoint:** `GET /resume/analytics/:resumeId`

**Authentication:** Required ✅

**Description:** Retrieve comprehensive analytics data for a resume.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO8601 | No | Start date for filtering (default: 30 days ago) |
| `endDate` | ISO8601 | No | End date for filtering (default: today) |
| `groupBy` | enum | No | Grouping: `day`, `week`, `month` (default: `day`) |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalViews": 245,
      "totalDownloads": 18,
      "totalShares": 12,
      "uniqueViewers": 156,
      "viewToDownloadRatio": 13.6,
      "shareToViewRatio": 4.9
    },
    "trends": {
      "views": [
        {
          "date": "2024-01-15",
          "value": 25,
          "change": 5.2
        },
        {
          "date": "2024-01-14",
          "value": 23,
          "change": -2.1
        }
      ],
      "downloads": [
        {
          "date": "2024-01-15",
          "value": 2,
          "change": 0
        }
      ],
      "shares": [
        {
          "date": "2024-01-15",
          "value": 1,
          "change": 0
        }
      ]
    },
    "sectionEngagement": [
      {
        "sectionName": "experience",
        "viewCount": 245,
        "timeSpentSeconds": 8750,
        "scrollDepth": 92,
        "engagementPercentage": 45.3,
        "rank": 1
      },
      {
        "sectionName": "skills",
        "viewCount": 245,
        "timeSpentSeconds": 3200,
        "scrollDepth": 78,
        "engagementPercentage": 16.6,
        "rank": 2
      }
    ],
    "viewHistory": [
      {
        "id": "view_001",
        "timestamp": "2024-01-15T14:30:00Z",
        "deviceType": "mobile",
        "browser": "Chrome",
        "operatingSystem": "iOS",
        "country": "US",
        "city": "San Francisco",
        "timeSpentSeconds": 120
      }
    ],
    "recentViewers": [
      {
        "viewerEmail": "recruiter@company.com",
        "viewerName": "Jane Smith",
        "lastViewedAt": "2024-01-15T14:30:00Z",
        "viewCount": 3,
        "deviceType": "desktop",
        "country": "US"
      }
    ]
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `summary` | object | High-level metrics summary |
| `trends` | object | Time-series data for views, downloads, shares |
| `sectionEngagement` | array | Engagement metrics per resume section |
| `viewHistory` | array | Detailed view records |
| `recentViewers` | array | Information about recent viewers |

**Error Responses:**

```json
// 400 - Invalid Date Range
{
  "success": false,
  "error": "Invalid date range specified",
  "code": "INVALID_DATE_RANGE"
}

// 500 - Data Retrieval Failed
{
  "success": false,
  "error": "Failed to retrieve analytics data",
  "code": "DATA_RETRIEVAL_FAILED"
}
```

**Example cURL:**

```bash
curl -X GET "https://api.finberslink.com/api/resume/analytics/resume_123?startDate=2024-01-01&endDate=2024-01-31&groupBy=day" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Export Analytics Report

**Endpoint:** `GET /resume/analytics/export`

**Authentication:** Required ✅

**Description:** Export analytics data in CSV or PDF format.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resumeId` | string | Yes | Resume to export analytics for |
| `format` | enum | Yes | `csv` or `pdf` |
| `startDate` | ISO8601 | No | Start date for export |
| `endDate` | ISO8601 | No | End date for export |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.finberslink.com/reports/resume_123_analytics_2024-01-15.csv",
    "fileName": "resume_123_analytics_2024-01-15.csv",
    "format": "csv",
    "generatedAt": "2024-01-15T15:00:00Z",
    "recordCount": 245
  }
}
```

---

## Publishing API

### Publish/Unpublish Resume

**Endpoint:** `POST /resume/publish`

**Authentication:** Required ✅

**Description:** Publish or unpublish a resume to make it publicly discoverable.

**Request Body:**

```json
{
  "resumeId": "resume_123",
  "publish": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resumeId` | string | Yes | Resume to publish/unpublish |
| `publish` | boolean | Yes | `true` to publish, `false` to unpublish |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "published": true,
    "publicUrl": "https://finberslink.com/public/resumes/pub_abc123xyz",
    "publicId": "pub_abc123xyz",
    "publishedAt": "2024-01-15T15:05:00Z"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `published` | boolean | Current publication status |
| `publicUrl` | string | Full public URL for the resume |
| `publicId` | string | Unique public identifier |
| `publishedAt` | ISO8601 | When resume was published |

**Error Responses:**

```json
// 409 - Already Published
{
  "success": false,
  "error": "Resume is already published",
  "code": "ALREADY_PUBLISHED"
}

// 400 - Invalid Public URL
{
  "success": false,
  "error": "Failed to generate public URL",
  "code": "INVALID_PUBLIC_URL"
}

// 403 - Access Denied
{
  "success": false,
  "error": "You don't have permission to publish this resume",
  "code": "ACCESS_DENIED"
}
```

**Example cURL:**

```bash
curl -X POST https://api.finberslink.com/api/resume/publish \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123",
    "publish": true
  }'
```

---

### Get Publication Status

**Endpoint:** `GET /resume/publish-status/:resumeId`

**Authentication:** Required ✅

**Description:** Check the publication status of a resume.

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "published": true,
    "publicUrl": "https://finberslink.com/public/resumes/pub_abc123xyz",
    "publishedAt": "2024-01-15T15:05:00Z",
    "viewCount": 42
  }
}
```

---

### View Public Resume

**Endpoint:** `GET /public/resumes/:publicId` 🔓

**Authentication:** Not Required

**Description:** View a published resume without authentication.

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "resume_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA",
      "summary": "...",
      "experience": [...],
      "education": [...],
      "skills": [...],
      "projects": [...]
    },
    "publisherName": "John Doe",
    "publishedAt": "2024-01-15T15:05:00Z",
    "viewCount": 42
  }
}
```

**Error Responses:**

```json
// 404 - Resume Not Found
{
  "success": false,
  "error": "Resume not found or is not published",
  "code": "NOT_FOUND"
}
```

---

### Search Published Resumes

**Endpoint:** `GET /resume/discovery/search` 🔓

**Authentication:** Not Required

**Description:** Search for published resumes by keywords, skills, roles, or industries.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Search query (keywords) |
| `skills` | string[] | No | Filter by skills (comma-separated) |
| `roles` | string[] | No | Filter by target roles (comma-separated) |
| `industries` | string[] | No | Filter by industries (comma-separated) |
| `limit` | number | No | Results per page (default: 20, max: 100) |
| `offset` | number | No | Pagination offset (default: 0) |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "resume_123",
        "publicId": "pub_abc123xyz",
        "firstName": "John",
        "lastName": "Doe",
        "targetRole": "Senior Software Engineer",
        "industry": "Technology",
        "skills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
        "summary": "Results-driven software engineer with 5+ years of experience...",
        "viewCount": 42,
        "publishedAt": "2024-01-15T15:05:00Z"
      }
    ],
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

**Example cURL:**

```bash
curl -X GET "https://api.finberslink.com/api/resume/discovery/search?q=software+engineer&skills=JavaScript,React&limit=20" \
  -H "Content-Type: application/json"
```

---

## Version History API

### Get Version History

**Endpoint:** `GET /resume/ai/versions/:resumeId`

**Authentication:** Required ✅

**Description:** Retrieve version history for a resume.

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "v_456",
        "createdAt": "2024-01-15T10:40:00Z",
        "createdBy": "user_123",
        "changeType": "suggestions_applied",
        "changeCount": 2,
        "summary": "Applied 2 AI suggestions"
      },
      {
        "id": "v_455",
        "createdAt": "2024-01-14T09:15:00Z",
        "createdBy": "user_123",
        "changeType": "manual_edit",
        "changeCount": 1,
        "summary": "Updated experience section"
      }
    ]
  }
}
```

---

### Rollback to Previous Version

**Endpoint:** `POST /resume/ai/versions/rollback`

**Authentication:** Required ✅

**Description:** Restore a resume to a previous version.

**Request Body:**

```json
{
  "resumeId": "resume_123",
  "versionId": "v_455"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "restored": true,
    "versionId": "v_455",
    "restoredAt": "2024-01-15T10:50:00Z"
  }
}
```

---

## Rate Limiting

All API endpoints are subject to rate limiting:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/resume/export` | 50 requests | Per day |
| `/resume/ai/suggestions` | 10 requests | Per hour |
| `/resume/analytics/events` | 1000 requests | Per hour |
| `/resume/analytics/:resumeId` | 100 requests | Per hour |
| `/resume/publish` | 100 requests | Per hour |
| `/resume/discovery/search` | 1000 requests | Per hour |

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1705334400
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (resource already exists) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |
| 504 | Gateway Timeout |

---

## Webhooks (Optional)

Resume features can trigger webhooks for real-time notifications:

### Resume Published Webhook

```json
{
  "event": "resume.published",
  "timestamp": "2024-01-15T15:05:00Z",
  "data": {
    "resumeId": "resume_123",
    "publicId": "pub_abc123xyz",
    "publicUrl": "https://finberslink.com/public/resumes/pub_abc123xyz"
  }
}
```

### Resume View Webhook

```json
{
  "event": "resume.viewed",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "resumeId": "resume_123",
    "viewCount": 42,
    "metadata": {
      "country": "US",
      "deviceType": "mobile"
    }
  }
}
```

---

## Best Practices

1. **Always include error handling** - Check for error responses and handle them gracefully
2. **Use pagination** - For endpoints returning lists, use `limit` and `offset` parameters
3. **Cache responses** - Cache analytics data client-side to reduce API calls
4. **Batch operations** - When approving multiple suggestions, batch them in a single request
5. **Monitor rate limits** - Check `X-RateLimit-*` headers and implement backoff strategies
6. **Validate input** - Validate all user input before sending to API
7. **Use HTTPS** - Always use HTTPS for API calls
8. **Handle timeouts** - Implement timeout handling for long-running operations like PDF generation


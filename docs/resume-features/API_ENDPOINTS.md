# Resume Features API Endpoints Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Resume Features Completion system. The system includes four major capability areas: PDF Export, AI Optimization, Analytics, and Publishing.

## Base URL

```
https://api.finberslink.com/api
```

All endpoints require authentication via JWT token in the `Authorization` header unless otherwise specified.

---

## PDF Export Endpoints

### Export Resume as PDF

**Endpoint:** `POST /resume/export`

**Authentication:** Required (JWT)

**Description:** Generate a PDF file of the resume with a selected template style.

**Request Body:**
```json
{
  "resumeId": "resume_123abc",
  "template": "Modern",
  "includeHeadshot": false
}
```

**Request Parameters:**
- `resumeId` (string, required): The unique identifier of the resume to export
- `template` (string, required): Template style - one of: `Modern`, `Classic`, `Minimal`
- `includeHeadshot` (boolean, optional): Whether to include profile photo in PDF (default: false)

**Response (Success - 200):**
```json
{
  "downloadUrl": "https://cdn.finberslink.com/exports/john_doe_resume.pdf",
  "fileName": "john_doe_Resume.pdf",
  "fileSize": 245632,
  "generatedAt": "2024-03-28T14:30:00Z",
  "template": "Modern",
  "expiresAt": "2024-03-29T14:30:00Z"
}
```

**Response Fields:**
- `downloadUrl` (string): Direct download URL for the generated PDF
- `fileName` (string): Filename in format `{firstName}_{lastName}_Resume.pdf`
- `fileSize` (number): Size of PDF file in bytes
- `generatedAt` (ISO8601): Timestamp when PDF was generated
- `template` (string): Template used for generation
- `expiresAt` (ISO8601): When the download link expires (24 hours)

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_RESUME_DATA` | Resume data is incomplete or invalid |
| 400 | `TEMPLATE_NOT_FOUND` | Selected template is not available |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 504 | `GENERATION_TIMEOUT` | PDF generation took too long (>30s) |
| 413 | `FILE_SIZE_EXCEEDED` | Generated PDF exceeds maximum file size (50MB) |
| 500 | `INTERNAL_ERROR` | Server error during PDF generation |

**Example cURL:**
```bash
curl -X POST https://api.finberslink.com/api/resume/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123abc",
    "template": "Modern"
  }'
```

**Rate Limiting:** 50 exports per day per user

---

## AI Optimization Endpoints

### Generate AI Suggestions

**Endpoint:** `POST /resume/ai/suggestions`

**Authentication:** Required (JWT)

**Description:** Analyze resume content and generate improvement suggestions using AI.

**Request Body:**
```json
{
  "resumeId": "resume_123abc",
  "analysisType": "full"
}
```

**Request Parameters:**
- `resumeId` (string, required): The unique identifier of the resume
- `analysisType` (string, optional): Type of analysis - one of: `full`, `summary`, `achievements`, `skills` (default: `full`)

**Response (Success - 200):**
```json
{
  "suggestions": [
    {
      "id": "sugg_456def",
      "category": "achievement",
      "originalText": "Improved system performance",
      "suggestedText": "Improved system performance by 40%, reducing page load time from 3.2s to 1.9s, resulting in 15% increase in user engagement",
      "explanation": "Using STAR method (Situation-Task-Action-Result) makes achievements more impactful and quantifiable",
      "confidenceLevel": "high",
      "targetField": "experience[0].achievements[1]",
      "status": "pending"
    },
    {
      "id": "sugg_789ghi",
      "category": "skill",
      "originalText": "JavaScript",
      "suggestedText": "JavaScript (ES6+, React, Node.js)",
      "explanation": "Adding specific technologies and frameworks increases relevance for job searches",
      "confidenceLevel": "medium",
      "targetField": "skills[2]",
      "status": "pending"
    }
  ],
  "analysisMetadata": {
    "completedAt": "2024-03-28T14:35:00Z",
    "modelUsed": "gpt-4",
    "tokensUsed": 1250,
    "totalSuggestions": 2
  }
}
```

**Response Fields:**
- `suggestions` (array): Array of suggestion objects
  - `id` (string): Unique suggestion identifier
  - `category` (string): Type of suggestion - `summary`, `achievement`, `skill`, `experience`
  - `originalText` (string): Current text in resume
  - `suggestedText` (string): Proposed improved text
  - `explanation` (string): Reasoning for the suggestion
  - `confidenceLevel` (string): `high`, `medium`, or `low`
  - `targetField` (string): Path to field in resume (e.g., `experience[0].achievements[1]`)
  - `status` (string): `pending`, `approved`, or `rejected`
- `analysisMetadata` (object): Metadata about the analysis
  - `completedAt` (ISO8601): When analysis completed
  - `modelUsed` (string): AI model used
  - `tokensUsed` (number): OpenAI tokens consumed
  - `totalSuggestions` (number): Total suggestions generated

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_RESUME_CONTENT` | Resume content is not suitable for analysis |
| 400 | `INSUFFICIENT_CONTENT` | Resume needs more content for meaningful suggestions |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests (max 10 per hour) |
| 503 | `SERVICE_UNAVAILABLE` | AI service is temporarily unavailable |
| 500 | `INTERNAL_ERROR` | Server error during analysis |

**Example cURL:**
```bash
curl -X POST https://api.finberslink.com/api/resume/ai/suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123abc",
    "analysisType": "full"
  }'
```

**Rate Limiting:** 10 requests per hour per user

---

### Approve Suggestions

**Endpoint:** `POST /resume/ai/suggestions/approve`

**Authentication:** Required (JWT)

**Description:** Approve and apply selected suggestions to the resume.

**Request Body:**
```json
{
  "resumeId": "resume_123abc",
  "suggestionIds": ["sugg_456def", "sugg_789ghi"]
}
```

**Request Parameters:**
- `resumeId` (string, required): The unique identifier of the resume
- `suggestionIds` (array, required): Array of suggestion IDs to approve

**Response (Success - 200):**
```json
{
  "appliedCount": 2,
  "versionId": "version_xyz789",
  "resumeUpdated": true,
  "appliedSuggestions": [
    {
      "id": "sugg_456def",
      "category": "achievement",
      "appliedAt": "2024-03-28T14:36:00Z"
    },
    {
      "id": "sugg_789ghi",
      "category": "skill",
      "appliedAt": "2024-03-28T14:36:00Z"
    }
  ]
}
```

**Response Fields:**
- `appliedCount` (number): Number of suggestions successfully applied
- `versionId` (string): ID of the version snapshot created before applying changes
- `resumeUpdated` (boolean): Whether resume was successfully updated
- `appliedSuggestions` (array): Details of applied suggestions

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_SUGGESTION_IDS` | One or more suggestion IDs are invalid |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 409 | `CONFLICT` | Suggestions have already been applied or rejected |
| 500 | `INTERNAL_ERROR` | Server error during application |

**Example cURL:**
```bash
curl -X POST https://api.finberslink.com/api/resume/ai/suggestions/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123abc",
    "suggestionIds": ["sugg_456def", "sugg_789ghi"]
  }'
```

---

### Reject Suggestions

**Endpoint:** `POST /resume/ai/suggestions/reject`

**Authentication:** Required (JWT)

**Description:** Reject selected suggestions without applying them.

**Request Body:**
```json
{
  "resumeId": "resume_123abc",
  "suggestionIds": ["sugg_456def"]
}
```

**Request Parameters:**
- `resumeId` (string, required): The unique identifier of the resume
- `suggestionIds` (array, required): Array of suggestion IDs to reject

**Response (Success - 200):**
```json
{
  "rejectedCount": 1,
  "rejectedSuggestions": [
    {
      "id": "sugg_456def",
      "category": "achievement",
      "rejectedAt": "2024-03-28T14:37:00Z"
    }
  ]
}
```

**Response Fields:**
- `rejectedCount` (number): Number of suggestions rejected
- `rejectedSuggestions` (array): Details of rejected suggestions

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_SUGGESTION_IDS` | One or more suggestion IDs are invalid |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 409 | `CONFLICT` | Suggestions have already been applied or rejected |
| 500 | `INTERNAL_ERROR` | Server error during rejection |

---

## Analytics Endpoints

### Get Resume Analytics

**Endpoint:** `GET /resume/analytics/:resumeId`

**Authentication:** Required (JWT)

**Description:** Retrieve comprehensive analytics data for a resume.

**Query Parameters:**
- `startDate` (ISO8601, optional): Start date for analytics period
- `endDate` (ISO8601, optional): End date for analytics period
- `groupBy` (string, optional): Grouping for trends - one of: `day`, `week`, `month` (default: `day`)

**Response (Success - 200):**
```json
{
  "summary": {
    "totalViews": 156,
    "totalDownloads": 23,
    "totalShares": 8,
    "uniqueViewers": 42,
    "viewToDownloadRatio": 6.78,
    "shareToViewRatio": 0.05,
    "averageViewsPerDay": 22.3
  },
  "trends": {
    "views": [
      {
        "date": "2024-03-28",
        "value": 25,
        "change": 12.5
      },
      {
        "date": "2024-03-27",
        "value": 22,
        "change": -4.3
      }
    ],
    "downloads": [
      {
        "date": "2024-03-28",
        "value": 3,
        "change": 50.0
      }
    ],
    "shares": [
      {
        "date": "2024-03-28",
        "value": 1,
        "change": 0.0
      }
    ]
  },
  "sectionEngagement": [
    {
      "sectionName": "Experience",
      "viewCount": 156,
      "timeSpentSeconds": 4320,
      "scrollDepth": 95,
      "engagementPercentage": 45.2,
      "rank": 1
    },
    {
      "sectionName": "Skills",
      "viewCount": 156,
      "timeSpentSeconds": 1800,
      "scrollDepth": 80,
      "engagementPercentage": 18.8,
      "rank": 2
    },
    {
      "sectionName": "Education",
      "viewCount": 142,
      "timeSpentSeconds": 1200,
      "scrollDepth": 60,
      "engagementPercentage": 12.5,
      "rank": 3
    }
  ],
  "viewHistory": [
    {
      "id": "view_001",
      "timestamp": "2024-03-28T14:45:00Z",
      "deviceType": "desktop",
      "browser": "Chrome",
      "operatingSystem": "Windows",
      "country": "United States",
      "city": "San Francisco",
      "timeSpentSeconds": 180
    },
    {
      "id": "view_002",
      "timestamp": "2024-03-28T13:20:00Z",
      "deviceType": "mobile",
      "browser": "Safari",
      "operatingSystem": "iOS",
      "country": "United States",
      "city": "New York",
      "timeSpentSeconds": 120
    }
  ],
  "recentViewers": [
    {
      "viewerEmail": "recruiter@company.com",
      "viewerName": "Jane Smith",
      "lastViewedAt": "2024-03-28T14:45:00Z",
      "viewCount": 3,
      "deviceType": "desktop",
      "country": "United States"
    }
  ]
}
```

**Response Fields:**
- `summary` (object): High-level analytics metrics
- `trends` (object): Time-series data for views, downloads, shares
- `sectionEngagement` (array): Engagement metrics per resume section
- `viewHistory` (array): Chronological list of resume views (most recent first)
- `recentViewers` (array): Information about recent viewers

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_DATE_RANGE` | Invalid date range specified |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 404 | `NOT_FOUND` | Resume not found |
| 500 | `INTERNAL_ERROR` | Server error retrieving analytics |

**Example cURL:**
```bash
curl -X GET "https://api.finberslink.com/api/resume/analytics/resume_123abc?startDate=2024-03-01&endDate=2024-03-28&groupBy=day" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Record Analytics Event

**Endpoint:** `POST /resume/analytics/events`

**Authentication:** Required (JWT)

**Description:** Record a resume engagement event (view, download, or share).

**Request Body:**
```json
{
  "resumeId": "resume_123abc",
  "eventType": "view",
  "metadata": {
    "deviceType": "desktop",
    "browser": "Chrome",
    "operatingSystem": "Windows",
    "country": "United States",
    "city": "San Francisco",
    "timeSpentSeconds": 180,
    "sectionEngagement": [
      {
        "sectionName": "Experience",
        "timeSpentSeconds": 120,
        "scrollDepth": 95
      },
      {
        "sectionName": "Skills",
        "timeSpentSeconds": 60,
        "scrollDepth": 80
      }
    ]
  }
}
```

**Request Parameters:**
- `resumeId` (string, required): The unique identifier of the resume
- `eventType` (string, required): Type of event - one of: `view`, `download`, `share`
- `metadata` (object, optional): Additional event metadata
  - `deviceType` (string): `desktop`, `mobile`, `tablet`
  - `browser` (string): Browser name
  - `operatingSystem` (string): OS name
  - `country` (string): Country name
  - `city` (string): City name
  - `timeSpentSeconds` (number): Time spent viewing resume
  - `shareMethod` (string): For share events - `email`, `linkedin`, `twitter`, etc.
  - `sectionEngagement` (array): Per-section engagement data

**Response (Success - 200):**
```json
{
  "eventId": "event_abc123",
  "recorded": true,
  "timestamp": "2024-03-28T14:45:00Z"
}
```

**Response Fields:**
- `eventId` (string): Unique identifier for the recorded event
- `recorded` (boolean): Whether event was successfully recorded
- `timestamp` (ISO8601): When the event was recorded

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_EVENT_TYPE` | Event type is not valid |
| 400 | `INVALID_METADATA` | Metadata format is invalid |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 404 | `NOT_FOUND` | Resume not found |
| 500 | `INTERNAL_ERROR` | Server error recording event |

---

### Export Analytics Report

**Endpoint:** `GET /resume/analytics/export`

**Authentication:** Required (JWT)

**Description:** Export analytics data in CSV or PDF format.

**Query Parameters:**
- `resumeId` (string, required): The unique identifier of the resume
- `format` (string, required): Export format - one of: `csv`, `pdf`
- `startDate` (ISO8601, optional): Start date for export period
- `endDate` (ISO8601, optional): End date for export period

**Response (Success - 200):**
```json
{
  "downloadUrl": "https://cdn.finberslink.com/reports/resume_123abc_analytics_2024-03-28.csv",
  "fileName": "resume_123abc_analytics_2024-03-28.csv",
  "format": "csv",
  "generatedAt": "2024-03-28T14:50:00Z",
  "expiresAt": "2024-03-29T14:50:00Z"
}
```

**Response Fields:**
- `downloadUrl` (string): Direct download URL for the report
- `fileName` (string): Filename of the generated report
- `format` (string): Format of the report
- `generatedAt` (ISO8601): When report was generated
- `expiresAt` (ISO8601): When download link expires

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_FORMAT` | Export format is not valid |
| 400 | `INVALID_DATE_RANGE` | Invalid date range specified |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 500 | `INTERNAL_ERROR` | Server error generating report |

---

## Publishing Endpoints

### Publish/Unpublish Resume

**Endpoint:** `POST /resume/publish`

**Authentication:** Required (JWT)

**Description:** Publish or unpublish a resume to make it publicly discoverable.

**Request Body:**
```json
{
  "resumeId": "resume_123abc",
  "publish": true
}
```

**Request Parameters:**
- `resumeId` (string, required): The unique identifier of the resume
- `publish` (boolean, required): Whether to publish (true) or unpublish (false)

**Response (Success - 200):**
```json
{
  "published": true,
  "publicUrl": "https://finberslink.com/public/resumes/pub_xyz789",
  "publicId": "pub_xyz789",
  "publishedAt": "2024-03-28T14:55:00Z"
}
```

**Response Fields:**
- `published` (boolean): Current publication status
- `publicUrl` (string): Public URL for the resume (if published)
- `publicId` (string): Unique public identifier
- `publishedAt` (ISO8601): When resume was published (if published)

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_RESUME_DATA` | Resume data is incomplete |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 409 | `ALREADY_PUBLISHED` | Resume is already published |
| 500 | `INTERNAL_ERROR` | Server error during publication |

**Example cURL:**
```bash
curl -X POST https://api.finberslink.com/api/resume/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "resume_123abc",
    "publish": true
  }'
```

---

### Get Publication Status

**Endpoint:** `GET /resume/publish-status/:resumeId`

**Authentication:** Required (JWT)

**Description:** Check the publication status of a resume.

**Response (Success - 200):**
```json
{
  "published": true,
  "publicUrl": "https://finberslink.com/public/resumes/pub_xyz789",
  "publishedAt": "2024-03-28T14:55:00Z",
  "viewCount": 156
}
```

**Response Fields:**
- `published` (boolean): Whether resume is currently published
- `publicUrl` (string): Public URL (if published)
- `publishedAt` (ISO8601): When resume was published (if published)
- `viewCount` (number): Total views of published resume

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | `UNAUTHORIZED` | User not authenticated |
| 403 | `FORBIDDEN` | User does not own this resume |
| 404 | `NOT_FOUND` | Resume not found |

---

### View Published Resume (Public)

**Endpoint:** `GET /public/resumes/:publicId`

**Authentication:** Not required

**Description:** View a published resume without authentication.

**Response (Success - 200):**
```json
{
  "resume": {
    "id": "resume_123abc",
    "summary": "Experienced software engineer...",
    "experience": [...],
    "education": [...],
    "skills": [...],
    "projects": [...]
  },
  "publisherName": "John Doe",
  "publishedAt": "2024-03-28T14:55:00Z",
  "viewCount": 156
}
```

**Response Fields:**
- `resume` (object): Complete resume data
- `publisherName` (string): Name of resume owner
- `publishedAt` (ISO8601): When resume was published
- `viewCount` (number): Total views

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | `NOT_FOUND` | Resume not found or not published |
| 410 | `GONE` | Resume was unpublished |

---

### Search Published Resumes

**Endpoint:** `GET /resume/discovery/search`

**Authentication:** Optional (JWT)

**Description:** Search for published resumes in the discovery index.

**Query Parameters:**
- `q` (string, optional): Search query (keywords, name, etc.)
- `skills` (array, optional): Filter by skills (comma-separated)
- `roles` (array, optional): Filter by target roles (comma-separated)
- `industries` (array, optional): Filter by industries (comma-separated)
- `limit` (number, optional): Results per page (default: 20, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Response (Success - 200):**
```json
{
  "results": [
    {
      "publicId": "pub_xyz789",
      "publisherName": "John Doe",
      "summary": "Experienced software engineer with 5+ years...",
      "skills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
      "targetRoles": ["Senior Engineer", "Tech Lead"],
      "industries": ["Technology", "Finance"],
      "viewCount": 156,
      "publishedAt": "2024-03-28T14:55:00Z",
      "publicUrl": "https://finberslink.com/public/resumes/pub_xyz789"
    }
  ],
  "total": 245,
  "limit": 20,
  "offset": 0
}
```

**Response Fields:**
- `results` (array): Array of published resume previews
- `total` (number): Total matching results
- `limit` (number): Results per page
- `offset` (number): Current pagination offset

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_FILTER` | Invalid filter parameters |
| 500 | `INTERNAL_ERROR` | Server error during search |

**Example cURL:**
```bash
curl -X GET "https://api.finberslink.com/api/resume/discovery/search?q=software+engineer&skills=JavaScript,React&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Rate Limiting

All endpoints are subject to rate limiting:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/resume/export` | 50 | Per day |
| `/resume/ai/suggestions` | 10 | Per hour |
| `/resume/analytics/events` | 1000 | Per hour |
| `/resume/analytics/:resumeId` | 100 | Per minute |
| `/resume/publish` | 100 | Per hour |
| `/resume/discovery/search` | 1000 | Per hour |

Rate limit information is returned in response headers:
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1711612800
```

---

## Error Handling

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context about the error"
    }
  }
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (missing or invalid authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `409`: Conflict (state conflict)
- `429`: Too many requests (rate limited)
- `500`: Internal server error
- `503`: Service unavailable
- `504`: Gateway timeout

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are obtained through the authentication endpoint and expire after 24 hours.

---

## Pagination

Endpoints that return lists support pagination via `limit` and `offset` query parameters:

```
GET /resume/discovery/search?limit=20&offset=40
```

- `limit`: Number of results per page (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

---

## Versioning

The API uses URL versioning. Current version is v1. Future versions will be available at `/api/v2/`, etc.

---

## Webhooks (Future)

Webhook support for analytics events is planned for a future release. Webhooks will allow real-time notifications of resume views, downloads, and shares.


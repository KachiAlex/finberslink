# Job Portal API Documentation

## Overview
Complete REST API for the job portal system with admin management, user applications, and analytics.

## Authentication
All endpoints require JWT authentication via `access_token` cookie, except public job listing endpoints.

## Base URL
```
/api
```

## Public Endpoints

### Jobs

#### List Jobs
```
GET /jobs
```

Query Parameters:
- `search` (string): Search jobs by title, company, or keywords
- `location` (string): Filter by location
- `jobType` (enum): FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
- `remoteOption` (enum): ONSITE, HYBRID, REMOTE
- `company` (string): Filter by company name
- `tags` (string): Comma-separated tags
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

Response:
```json
{
  "jobs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Job Details
```
GET /jobs/[id]
```

Response:
```json
{
  "job": {
    "id": "string",
    "title": "string",
    "company": "string",
    "location": "string",
    "country": "string",
    "jobType": "FULL_TIME",
    "remoteOption": "HYBRID",
    "salaryRange": "string",
    "description": "string",
    "requirements": ["string"],
    "tags": ["string"],
    "createdAt": "ISO8601",
    "_count": {
      "applications": 10
    }
  }
}
```

#### Apply for Job
```
POST /jobs/[id]/applications
```

Request:
```json
{
  "resumeId": "string",
  "coverLetter": "string (optional)"
}
```

Response:
```json
{
  "message": "Application submitted successfully",
  "application": {
    "id": "string",
    "status": "SUBMITTED",
    "submittedAt": "ISO8601"
  }
}
```

### Companies

#### List Companies
```
GET /companies
```

Query Parameters:
- `search` (string): Search by company name or industry
- `page` (number): Page number
- `limit` (number): Results per page

Response:
```json
{
  "companies": [...],
  "pagination": {...}
}
```

## User Endpoints (Authenticated)

### Applications

#### List User Applications
```
GET /user/applications
```

Query Parameters:
- `page` (number): Page number
- `limit` (number): Results per page
- `status` (enum): Filter by status

Response:
```json
{
  "applications": [...],
  "pagination": {...}
}
```

#### Get Application Details
```
GET /user/applications/[applicationId]
```

Response:
```json
{
  "application": {
    "id": "string",
    "status": "REVIEWING",
    "submittedAt": "ISO8601",
    "opportunity": {...},
    "resume": {...}
  }
}
```

### Dashboard

#### Get User Dashboard
```
GET /user/dashboard
```

Response:
```json
{
  "user": {
    "id": "string",
    "role": "STUDENT"
  },
  "stats": {
    "totalApplications": 5,
    "resumes": 2,
    "statusBreakdown": {
      "SUBMITTED": 2,
      "REVIEWING": 1,
      "INTERVIEW": 1,
      "OFFER": 1,
      "REJECTED": 0
    }
  },
  "recentApplications": [...]
}
```

## Admin Endpoints (Authenticated - ADMIN/SUPER_ADMIN only)

### Job Management

#### List All Jobs
```
GET /admin/jobs
```

Query Parameters:
- `page` (number): Page number
- `limit` (number): Results per page

Response:
```json
{
  "jobs": [...],
  "pagination": {...}
}
```

#### Create Job
```
POST /admin/jobs
```

Request:
```json
{
  "title": "string",
  "company": "string",
  "location": "string",
  "country": "string",
  "jobType": "FULL_TIME",
  "remoteOption": "HYBRID",
  "description": "string (optional)",
  "salaryRange": "string (optional)",
  "requirements": ["string"] (optional),
  "tags": ["string"] (optional)
}
```

Response:
```json
{
  "message": "Job created successfully",
  "job": {...}
}
```

#### Get Job Details
```
GET /admin/jobs/[jobId]
```

Response:
```json
{
  "job": {...}
}
```

#### Update Job
```
PUT /admin/jobs/[jobId]
```

Request:
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "salaryRange": "string (optional)",
  "requirements": ["string"] (optional),
  "tags": ["string"] (optional),
  "isActive": "boolean (optional)",
  "featured": "boolean (optional)"
}
```

#### Delete Job
```
DELETE /admin/jobs/[jobId]
```

Response:
```json
{
  "message": "Job deleted successfully"
}
```

### Application Management

#### List Job Applications
```
GET /admin/jobs/[jobId]/applications
```

Query Parameters:
- `page` (number): Page number
- `limit` (number): Results per page
- `status` (enum): Filter by status

Response:
```json
{
  "applications": [...],
  "pagination": {...}
}
```

#### Update Application Status
```
PUT /admin/applications/[applicationId]
```

Request:
```json
{
  "status": "REVIEWING|INTERVIEW|OFFER|REJECTED"
}
```

Response:
```json
{
  "message": "Application status updated successfully",
  "application": {...}
}
```

### Analytics

#### Get Job Analytics
```
GET /admin/jobs/analytics
```

Response:
```json
{
  "metrics": {
    "totalJobs": 50,
    "totalApplications": 250,
    "avgApplicationsPerJob": 5
  },
  "statusBreakdown": {
    "SUBMITTED": 100,
    "REVIEWING": 80,
    "INTERVIEW": 50,
    "OFFER": 15,
    "REJECTED": 5
  },
  "typeDistribution": {
    "FULL_TIME": 30,
    "PART_TIME": 10,
    "CONTRACT": 5,
    "INTERNSHIP": 5
  },
  "remoteDistribution": {
    "REMOTE": 20,
    "HYBRID": 20,
    "ONSITE": 10
  },
  "topJobs": [...],
  "recentApplications": [...]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized - please log in"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden - you don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Status Codes

- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Application Status Flow

```
SUBMITTED → REVIEWING → INTERVIEW → OFFER
                    ↓
                 REJECTED
```

## Job Types
- FULL_TIME
- PART_TIME
- CONTRACT
- INTERNSHIP

## Remote Options
- ONSITE
- HYBRID
- REMOTE

## User Roles
- STUDENT
- TUTOR
- ADMIN
- SUPER_ADMIN
- EMPLOYER

## Rate Limiting
Currently no rate limiting implemented. Recommended for production:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

## Pagination
All list endpoints support pagination with default page size of 20.

## Filtering & Sorting
- Jobs can be filtered by multiple criteria
- Results are sorted by creation date (newest first)
- Search is case-insensitive

## Future Enhancements
- Job alerts and email notifications
- Company profiles and management
- Advanced analytics and reporting
- Job recommendations
- Saved jobs functionality

# Job Portal Setup Guide

## Database Migration

Before using the job portal, you need to run the Prisma migration to set up the database schema.

### Prerequisites
- PostgreSQL database (Neon or local)
- Valid `DATABASE_URL` in `.env` or `.env.local`

### Steps

1. **Run Migration**
```bash
npx prisma migrate dev --name add_job_portal_fields
```

This will:
- Create `JobOpportunity` table
- Create `JobApplication` table
- Create `Company` table (optional, for future use)
- Create `JobAlert` table (optional, for future use)
- Generate Prisma client types

2. **Verify Migration**
```bash
npx prisma studio
```

This opens Prisma Studio to view the database schema.

## Environment Variables

Add these to your `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OpenAI (for AI resume builder)
OPENAI_API_KEY="sk-proj-..."
```

## API Endpoints Overview

### Public Endpoints
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/[id]` - Get job details
- `POST /api/jobs/[id]/applications` - Apply for job
- `GET /api/companies` - List companies

### User Endpoints (Authenticated)
- `GET /api/user/dashboard` - User dashboard
- `GET /api/user/applications` - List user applications
- `GET /api/user/applications/[id]` - Get application details

### Admin Endpoints (ADMIN/SUPER_ADMIN)
- `GET /api/admin/jobs` - List all jobs
- `POST /api/admin/jobs` - Create job
- `GET /api/admin/jobs/[id]` - Get job details
- `PUT /api/admin/jobs/[id]` - Update job
- `DELETE /api/admin/jobs/[id]` - Delete job
- `GET /api/admin/jobs/[id]/applications` - List job applications
- `PUT /api/admin/applications/[id]` - Update application status
- `GET /api/admin/jobs/analytics` - Get analytics

## Features

### Phase 1: Core Job Portal
- ✅ Public job board with search and filters
- ✅ Job details page
- ✅ Application system
- ✅ Admin job management
- ✅ Application tracking

### Phase 2: Advanced Features
- ✅ Company profiles
- ✅ Job analytics dashboard
- ✅ Job alerts system (UI ready, backend pending migration)
- ✅ Featured jobs management
- ✅ AI resume builder integration

## Testing

### Manual Testing
1. Create a job via `/admin/jobs`
2. View job on `/jobs`
3. Apply for job via `/jobs/[slug]/apply`
4. Track application on `/dashboard/job-applications`
5. Manage application status in admin dashboard

### API Testing
Use Postman or curl to test endpoints:

```bash
# List jobs
curl http://localhost:3000/api/jobs

# Get job details
curl http://localhost:3000/api/jobs/[id]

# Apply for job (requires auth)
curl -X POST http://localhost:3000/api/jobs/[id]/applications \
  -H "Content-Type: application/json" \
  -d '{"resumeId": "...", "coverLetter": "..."}'
```

## Troubleshooting

### Migration Fails
- Check database connection
- Ensure `DATABASE_URL` is correct
- Run `npx prisma db push` to sync schema

### API Returns 401 Unauthorized
- Ensure user is logged in
- Check `access_token` cookie is set
- Verify JWT token is valid

### API Returns 403 Forbidden
- Check user role (must be ADMIN or SUPER_ADMIN for admin endpoints)
- Verify user has correct permissions

### Job Not Found
- Ensure job ID is correct
- Check job is active (`isActive: true`)
- Verify job exists in database

## Performance Optimization

### Caching
- Job listings are cached for 5 minutes
- Analytics data is cached for 1 hour
- User dashboard is cached for 1 minute

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Use pagination for large datasets

### Indexing
Recommended database indexes:
- `JobOpportunity(isActive, createdAt)`
- `JobApplication(userId, status)`
- `JobApplication(jobOpportunityId)`

## Future Enhancements

1. **Email Notifications**
   - Job alert emails
   - Application status updates
   - New job recommendations

2. **Advanced Search**
   - Full-text search
   - Saved searches
   - Search suggestions

3. **Recommendations**
   - ML-based job recommendations
   - Similar jobs
   - Skill-based matching

4. **Integrations**
   - LinkedIn import
   - Indeed sync
   - ATS integration

## Support

For issues or questions:
1. Check the API documentation: `/docs/JOB_PORTAL_API.md`
2. Review error messages in console
3. Check database connection
4. Verify authentication tokens

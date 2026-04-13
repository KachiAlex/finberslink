# Implementation Plan: High-Priority App Features Fix

## Overview

This implementation plan breaks down the four high-priority features into discrete, actionable coding tasks. Each feature area includes database migrations, API endpoints, UI components, and testing tasks. Tasks are organized to build incrementally, with each step validating core functionality through code.

## Tasks

### Feature 1: Resume Publishing

- [ ] 1.1 Create ResumePublishing database migration
  - Add migration to create ResumePublishing table with fields: id, resumeId, publicId, published, publishedAt, unpublishedAt, viewCount, lastViewedAt, createdAt, updatedAt
  - Add unique constraints on resumeId and publicId
  - Add foreign key relationship to Resume table
  - _Requirements: 1.1, 1.8, 6.1, 6.2, 6.3_

- [ ] 1.2 Implement publishResume API endpoint
  - Create POST `/api/resumes/[resumeId]/publish` endpoint
  - Verify user owns the resume (authorization check)
  - Generate unique publicId using secure random token
  - Create or update ResumePublishing record with published=true and publishedAt timestamp
  - Update Resume visibility to PUBLIC
  - Return publicId and publicUrl in response
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 9.1, 11.1_

- [ ] 1.3 Implement unpublishResume API endpoint
  - Create POST `/api/resumes/[resumeId]/unpublish` endpoint
  - Verify user owns the resume
  - Set published=false and unpublishedAt timestamp
  - Update Resume visibility to PRIVATE
  - Return success response
  - _Requirements: 1.9, 9.1_

- [ ] 1.4 Create public resume view page
  - Create `/app/public/resumes/[publicId]/page.tsx` component
  - Query ResumePublishing by publicId
  - Fetch associated Resume data
  - Display resume content without authentication
  - Increment viewCount and update lastViewedAt on each view
  - Return 404 if resume not published or publicId invalid
  - _Requirements: 1.5, 1.10, 6.5_

- [ ]* 1.5 Write property tests for resume publishing
  - **Property 1: Resume Publishing Idempotency** - Publishing same resume multiple times returns same publicId
  - **Property 2: Resume Visibility Consistency** - Published resume has visibility=PUBLIC and published=true
  - **Property 3: Public Resume Access** - Published resume accessible at public URL without auth
  - **Property 4: Resume Unpublishing** - Unpublished resume returns 404 at public URL
  - **Property 15: Resume Publishing Authorization** - Only resume owner can publish
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.10, 9.1_

- [ ] 1.6 Checkpoint - Resume Publishing Complete
  - Ensure all resume publishing tests pass
  - Verify public resume URLs work correctly
  - Ask the user if questions arise

### Feature 2: Email Sending for Resume Shares

- [ ] 2.1 Add emailSentAt field to ResumeShareLink model
  - Create migration to add emailSentAt DateTime field to ResumeShareLink table
  - Field should be nullable (NULL until email is sent)
  - _Requirements: 2.3, 7.3_

- [ ] 2.2 Implement sendShareInvitationEmail service function
  - Create service function in `/src/services/email-sharing.ts`
  - Accept shareLink, recipientEmail, senderName, and optional message
  - Validate email format before sending
  - Build email template with share URL, expiration date, and custom message
  - Send email using SendGrid or Resend API
  - Update shareLink.emailSentAt with current timestamp
  - Implement retry logic (up to 3 retries with exponential backoff)
  - Log errors but don't throw (graceful failure)
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.7, 2.11, 2.12, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 2.3 Update resume share API endpoint to send emails
  - Modify POST `/api/resumes/[resumeId]/share` endpoint
  - After creating share links, call sendShareInvitationEmail for each recipient
  - Validate email addresses before processing
  - Skip invalid emails and continue with others
  - Return count of successfully sent emails
  - Handle email service failures gracefully
  - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.10, 2.12, 9.2_

- [ ] 2.4 Create email template for share invitations
  - Create email template file `/src/templates/share-invitation-email.tsx`
  - Include sender name, resume title, share URL, expiration date
  - Include custom message if provided
  - Make template responsive and professional
  - _Requirements: 2.2, 2.11, 12.4_

- [ ]* 2.5 Write property tests for email sharing
  - **Property 5: Share Link Email Delivery** - Email sent updates emailSentAt and includes share URL
  - **Property 6: Share Link Expiration** - Expired share links return 404
  - **Property 7: Email Sending Resilience** - Failed emails retry up to 3 times
  - **Property 16: Share Link Authorization** - Only resume owner can share
  - **Property 22: Share Link Token Uniqueness** - Each share link has unique, non-reusable token
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.8, 2.9, 2.10, 2.12, 9.2, 11.2_

- [ ] 2.6 Checkpoint - Email Sharing Complete
  - Ensure all email sending tests pass
  - Verify emails are sent with correct content
  - Ask the user if questions arise

### Feature 3: Company Profile Pages

- [ ] 3.1 Add companyId field to JobOpportunity model
  - Create migration to add companyId String field to JobOpportunity table
  - Add foreign key relationship to Company table
  - Make field nullable initially for backward compatibility
  - _Requirements: 3.4, 8.4, 10.6_

- [ ] 3.2 Add viewCount field to Company model
  - Create migration to add viewCount Int field to Company table with default value 0
  - _Requirements: 3.5, 8.2, 11.3_

- [ ] 3.3 Implement getCompanyBySlug service function
  - Create service function in `/src/services/company-profile.ts`
  - Query Company by slug
  - Return company data with all fields
  - Return null if not found
  - _Requirements: 3.1, 8.1_

- [ ] 3.4 Implement getCompanyJobs service function
  - Create service function to query JobOpportunity by companyId
  - Filter to only active jobs (status = 'active')
  - Return array of jobs
  - Implement pagination (20 per page)
  - _Requirements: 3.2, 3.4, 8.3, 10.6_

- [ ] 3.5 Implement getCompanyStats service function
  - Create service function to calculate company statistics
  - Count active jobs for company
  - Sum total applications across all company jobs
  - Return viewCount from Company record
  - Return stats object with jobCount, applicationCount, totalViews
  - _Requirements: 3.3, 3.5, 8.5, 11.3_

- [ ] 3.6 Create company profile API endpoint
  - Create GET `/api/companies/[slug]` endpoint
  - Call getCompanyBySlug to fetch company
  - Call getCompanyJobs to fetch jobs
  - Call getCompanyStats to calculate statistics
  - Increment company viewCount by 1
  - Return 404 if company not found
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3, 8.5, 11.3_

- [ ] 3.7 Create company profile page component
  - Create `/app/companies/[slug]/page.tsx` component
  - Fetch company data from API endpoint
  - Display company logo, name, description, industry, location, website
  - Display active job listings with application counts
  - Display company statistics (jobs, applications, views)
  - Show empty state if no active jobs
  - Allow public access without authentication
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8, 9.7, 16.6_

- [ ]* 3.8 Write property tests for company profiles
  - **Property 8: Company Profile Completeness** - Profile displays company info, jobs, and stats
  - **Property 9: Company Job Listing** - Jobs list only includes active jobs from that company
  - **Property 10: Company Statistics Accuracy** - Stats accurately reflect jobs, applications, views
  - **Property 17: Company Profile Authorization** - Public access allowed without authentication
  - **Property 23: Company View Count Accuracy** - ViewCount incremented by exactly 1 per view
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.5, 9.7, 11.3_

- [ ] 3.9 Checkpoint - Company Profiles Complete
  - Ensure all company profile tests pass
  - Verify company pages load within 2 seconds
  - Ask the user if questions arise

### Feature 4: Navigation Links & Admin Settings

- [ ] 4.1 Create admin settings page component
  - Create `/app/admin/settings/page.tsx` component
  - Verify user has ADMIN role (authorization check)
  - Display system configuration sections: email settings, rate limits, feature flags
  - Display admin statistics: total users, total jobs, total applications, total resumes
  - Implement form for updating settings
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 9.5, 16.5_

- [ ] 4.2 Implement getSystemSettings API endpoint
  - Create GET `/api/admin/settings` endpoint
  - Verify user has ADMIN role
  - Query system configuration from database or environment
  - Return settings object with email, rate limits, feature flags
  - _Requirements: 4.1, 4.3, 4.7_

- [ ] 4.3 Implement getAdminStats API endpoint
  - Create GET `/api/admin/stats` endpoint
  - Verify user has ADMIN role
  - Calculate total users count
  - Calculate total jobs count
  - Calculate total applications count
  - Calculate total resumes count
  - Return stats object
  - _Requirements: 4.4, 4.7_

- [ ] 4.4 Implement updateSystemSettings API endpoint
  - Create POST `/api/admin/settings` endpoint
  - Verify user has ADMIN role
  - Validate settings before saving
  - Update system configuration in database
  - Log the update with adminId and changed fields
  - Return updated settings
  - _Requirements: 4.5, 4.6, 4.7, 17.6_

- [ ] 4.5 Create employer jobs list page
  - Create `/app/employer/jobs/page.tsx` component
  - Verify user has EMPLOYER role
  - Fetch all jobs posted by current employer
  - Display job title, status, creation date, application count
  - Include link to create new job
  - Include link to edit each job
  - _Requirements: 5.1, 5.2, 9.6, 16.4_

- [ ] 4.6 Create employer job posting form page
  - Create `/app/employer/jobs/new/page.tsx` component
  - Verify user has EMPLOYER role
  - Display job posting form (reuse from admin if possible)
  - On submit, create JobOpportunity with postedById=userId and companyId=employer's company
  - Redirect to employer jobs list on success
  - _Requirements: 5.2, 5.3, 5.10, 9.3, 9.6_

- [ ] 4.7 Create employer job editing page
  - Create `/app/employer/jobs/[jobId]/edit/page.tsx` component
  - Verify user has EMPLOYER role
  - Verify user owns the job (postedById matches userId)
  - Fetch job data and pre-populate form
  - On submit, update JobOpportunity record
  - Redirect to employer jobs list on success
  - _Requirements: 5.6, 5.7, 5.8, 9.4, 9.6_

- [ ] 4.8 Implement createEmployerJobPosting API endpoint
  - Create POST `/api/employer/jobs` endpoint
  - Verify user has EMPLOYER role
  - Validate job data (title, company, location, description required)
  - Create JobOpportunity with postedById=userId and companyId from request
  - Link job to company via companyId field
  - Set postedById immutably
  - Log job creation with employerId and jobId
  - Return created job
  - _Requirements: 5.1, 5.3, 5.9, 5.10, 9.3, 9.4, 9.6, 11.5, 17.5_

- [ ] 4.9 Implement updateEmployerJobPosting API endpoint
  - Create PUT `/api/employer/jobs/[jobId]` endpoint
  - Verify user has EMPLOYER role
  - Verify user owns the job (postedById matches userId)
  - Update JobOpportunity record with new data
  - Prevent modification of postedById field
  - Log job update with employerId and jobId
  - Return updated job
  - _Requirements: 5.6, 5.7, 5.9, 9.4, 9.6, 11.5, 17.5_

- [ ] 4.10 Implement getEmployerJobs API endpoint
  - Create GET `/api/employer/jobs` endpoint
  - Verify user has EMPLOYER role
  - Query JobOpportunity records where postedById=userId
  - Return array of jobs with status, creation date, application count
  - _Requirements: 5.1, 5.2, 9.6_

- [ ] 4.11 Add redirect for /jobs/post route
  - Create redirect from `/jobs/post` to `/employer/jobs/new`
  - Redirect only applies to users with EMPLOYER role
  - Non-employers see appropriate error or redirect to dashboard
  - _Requirements: 5.5, 15.1_

- [ ]* 4.12 Write property tests for admin and employer features
  - **Property 11: Admin Settings Access Control** - Only ADMIN role can access settings
  - **Property 12: Employer Job Posting Authorization** - Only EMPLOYER role can post jobs
  - **Property 13: Employer Job Ownership** - Only job owner can edit their jobs
  - **Property 14: Job Posting Redirect** - /jobs/post redirects to /employer/jobs/new for employers
  - **Property 25: Job Posting Immutability** - postedById field is immutable after creation
  - _Requirements: 4.1, 4.2, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9, 5.10, 9.3, 9.4, 9.5, 9.6, 11.5_

- [ ] 4.13 Checkpoint - Admin Settings & Employer Jobs Complete
  - Ensure all admin and employer tests pass
  - Verify admin settings page loads within 2 seconds
  - Verify employer jobs page loads within 2 seconds
  - Ask the user if questions arise

### Feature 5: Data Integrity & Performance

- [ ] 5.1 Add database indexes for performance
  - Add index on ResumePublishing.publicId for fast public URL lookups
  - Add index on JobOpportunity.companyId for fast company job queries
  - Add index on JobOpportunity.postedById for fast employer job queries
  - Add index on ResumeShareLink.shareToken for fast share link lookups
  - Add index on Company.slug for fast company profile lookups
  - _Requirements: 10.6, 10.7_

- [ ] 5.2 Implement database transaction for resume publishing
  - Wrap ResumePublishing creation and Resume visibility update in transaction
  - Ensure atomic operation (both succeed or both fail)
  - Handle transaction rollback on error
  - _Requirements: 11.1, 6.6_

- [ ] 5.3 Implement database transaction for job creation
  - Wrap JobOpportunity creation and company linkage in transaction
  - Ensure atomic operation
  - Handle transaction rollback on error
  - _Requirements: 11.1_

- [ ]* 5.4 Write integration tests for data integrity
  - **Property 18: Resume Publishing Performance** - Publishing completes within 1 second
  - **Property 19: Email Sending Performance** - Email sending completes within 5 seconds
  - **Property 20: Company Profile Loading Performance** - Profile loads within 2 seconds
  - **Property 21: Resume Publishing Atomicity** - Publishing is atomic operation
  - **Property 24: Resume Data Immutability** - Resume data unchanged after publishing
  - _Requirements: 1.7, 2.7, 3.7, 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.4_

- [ ] 5.5 Checkpoint - Data Integrity & Performance Complete
  - Ensure all integration tests pass
  - Verify performance benchmarks are met
  - Ask the user if questions arise

### Feature 6: Error Handling & Logging

- [ ] 6.1 Implement comprehensive error handling
  - Add error handling for resume not found (404)
  - Add error handling for unauthorized access (403)
  - Add error handling for email service failures (500)
  - Add error handling for invalid email addresses (skip and continue)
  - Add error handling for company not found (404)
  - Add error handling for job not found (404)
  - Return appropriate HTTP status codes and error messages
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ] 6.2 Implement logging for all major operations
  - Log resume publishing with userId, resumeId, timestamp
  - Log email sending with recipient email, shareLink ID, timestamp
  - Log email failures with error details
  - Log company profile access with company ID, timestamp
  - Log job creation with employerId, jobId, timestamp
  - Log admin settings updates with adminId, changed fields, timestamp
  - Use structured logging format
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 6.3 Checkpoint - Error Handling & Logging Complete
  - Ensure all error scenarios are handled gracefully
  - Verify logging captures all required information
  - Ask the user if questions arise

### Feature 7: Security & Validation

- [ ] 7.1 Implement security measures
  - Generate cryptographically secure shareToken for share links
  - Validate company slug to prevent path traversal
  - Validate email addresses before storing
  - Sanitize user input in all forms
  - Encrypt sensitive data in audit logs
  - Implement rate limiting for email sending (50 per hour per user)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 12.6_

- [ ] 7.2 Implement input validation
  - Validate resume data before publishing
  - Validate email addresses in share requests
  - Validate job posting data
  - Validate admin settings updates
  - Return validation errors with clear messages
  - _Requirements: 4.6, 12.7, 13.5_

- [ ] 7.3 Checkpoint - Security & Validation Complete
  - Ensure all security measures are in place
  - Verify input validation works correctly
  - Ask the user if questions arise

### Feature 8: Final Integration & Testing

- [ ] 8.1 Write end-to-end integration tests
  - Test full resume publishing flow: publish → access public URL → verify content
  - Test full sharing flow: create share link → send email → verify recipient receives
  - Test company profile flow: load profile → verify jobs displayed → verify stats accurate
  - Test employer job posting flow: create job → verify in employer list → verify in company profile
  - Test admin settings flow: access settings → update config → verify changes persisted
  - _Requirements: All requirements_

- [ ] 8.2 Verify backward compatibility
  - Ensure existing resume sharing functionality still works
  - Ensure existing job posting functionality still works
  - Ensure existing company data access still works
  - Test with existing data in database
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 8.3 Final checkpoint - All features complete
  - Ensure all tests pass (unit, property, integration)
  - Verify all performance benchmarks met
  - Verify all security measures in place
  - Verify all error handling works correctly
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All tasks build on previous tasks with no orphaned code
- Database migrations should be run before dependent API endpoints
- API endpoints should be tested before UI components
- UI components should be tested with real API endpoints

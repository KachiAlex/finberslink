# Implementation Plan: Critical App Features Fix

## Overview

This implementation plan breaks down the five critical features into discrete, actionable coding tasks. Each task builds incrementally on previous work, with testing integrated throughout. The features are organized by functional area: Resume PDF Export, Resume Sharing with Email, Employer Applications Review, Employer Job Posting, and Application Withdrawal.

## Tasks

- [ ] 1. Set up database migrations and data models
  - [ ] 1.1 Create migration for JobApplication schema updates
    - Add `withdrawnAt` DateTime field (nullable)
    - Add `withdrawalReason` String field (nullable)
    - Add index on `status` and `userId` for query performance
    - _Requirements: 5.1, 5.2, 15.1_
  
  - [ ] 1.2 Create ApplicationAuditLog model and migration
    - Define schema with fields: id, applicationId, userId, action, previousStatus, newStatus, reason, metadata, createdAt
    - Add foreign key relationships to JobApplication and User
    - Add index on applicationId and createdAt for efficient queries
    - _Requirements: 8.1, 8.2, 8.3, 8.7_
  
  - [ ] 1.3 Update Prisma schema with new models
    - Add ApplicationAuditLog model to schema.prisma
    - Update JobApplication model with new fields
    - Add relations between models
    - _Requirements: 1.1, 5.1, 8.1_

- [ ] 2. Implement Resume PDF Export Service
  - [ ] 2.1 Create PDF generation service with html2canvas and jsPDF
    - Implement `generateResumePDF(resumeId, template, options)` function
    - Fetch resume data from database
    - Generate HTML from resume template
    - Convert HTML to canvas using html2canvas with scale: 2, useCORS: true
    - Create PDF from canvas using jsPDF with A4 portrait format
    - Add PDF metadata (title, author, subject, creator)
    - Return PDF buffer
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 2.2 Add authorization check for PDF export
    - Verify user owns the resume before generating PDF
    - Return 403 Forbidden if unauthorized
    - _Requirements: 1.8, 9.1_
  
  - [ ] 2.3 Create API endpoint for PDF export
    - Create `POST /api/resumes/{resumeId}/export` endpoint
    - Accept template and options in request body
    - Call PDF generation service
    - Set response headers for PDF download (Content-Type, Content-Disposition)
    - Implement rate limiting (5 exports per minute per user)
    - Record export event in database with timestamp
    - _Requirements: 1.1, 1.5, 1.7, 9.7_
  
  - [ ] 2.4 Add photo rendering support to PDF generation
    - Modify PDF generation to handle resume photos
    - Check `includePhoto` option in export request
    - Render photo in PDF if option enabled and photo exists
    - _Requirements: 1.4_
  
  - [ ]* 2.5 Write property tests for PDF generation
    - **Property 1: PDF Generation Completeness** - For any valid resume, generating a PDF SHALL produce a non-empty buffer containing valid PDF structure with all resume sections
    - **Property 2: PDF Metadata Correctness** - For any resume export, the generated PDF SHALL contain metadata including title, author, subject, and creation date matching resume data
    - **Property 3: PDF Photo Rendering** - For any resume with photo and includePhoto enabled, the generated PDF SHALL render the photo in output
    - **Property 20: Resume Export Authorization** - For any resume export request, the system SHALL verify the user owns the resume before generating PDF
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8_
  
  - [ ]* 2.6 Write unit tests for PDF export endpoint
    - Test successful PDF generation and download
    - Test authorization failure (user doesn't own resume)
    - Test rate limiting (exceeding 5 per minute)
    - Test invalid resume ID
    - Test missing required fields
    - _Requirements: 1.1, 1.8, 9.7_

- [ ] 3. Implement Resume Sharing with Email Service
  - [ ] 3.1 Create sharing service for generating share links
    - Implement `createShareLink(resumeId, userId, recipients, expirationDays)` function
    - Validate recipients array (max 50 recipients)
    - Generate unique tokens for each recipient
    - Create ResumeShareLink records in database
    - Set expiration date (default 7 days, max 30 days)
    - _Requirements: 2.1, 2.4, 13.6_
  
  - [ ] 3.2 Implement email sending for share invitations
    - Implement `sendShareInvitationEmail(shareLink, recipientEmail, senderName, message)` function
    - Build email content with sender name, resume title, share URL, expiration date
    - Send email using SendGrid or Resend API
    - Update shareLink with emailSentAt timestamp on success
    - Implement retry logic (up to 3 retries with exponential backoff)
    - Log errors and continue with other recipients
    - _Requirements: 2.2, 2.3, 2.9, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 3.3 Create API endpoint for resume sharing
    - Create `POST /api/resumes/{resumeId}/share` endpoint
    - Accept recipients array and optional message in request body
    - Verify user owns the resume
    - Call sharing service to create share links
    - Call email service to send invitations
    - Implement rate limiting (50 recipients per hour per user)
    - Return success response with recipient count and expiration date
    - _Requirements: 2.1, 2.2, 2.8, 2.10, 9.2, 9.8_
  
  - [ ] 3.4 Create share link view tracking
    - Implement endpoint to view shared resume via token
    - Validate token format and expiration
    - Increment view count on successful access
    - Record lastViewedAt timestamp
    - Return 404 if link expired or invalid
    - _Requirements: 2.5, 2.7, 9.9_
  
  - [ ]* 3.5 Write property tests for email sharing
    - **Property 4: Share Link Creation Completeness** - For any list of recipients, creating share links SHALL produce one unique link per recipient with valid tokens and expiration dates
    - **Property 5: Email Delivery Tracking** - For any share link, sending invitation email SHALL update emailSentAt timestamp and include share URL and expiration date in email body
    - **Property 6: Share Link Expiration Enforcement** - For any share link where current time exceeds expiration, accessing link SHALL return 404 and prevent resume access
    - **Property 21: Resume Sharing Authorization** - For any resume sharing request, the system SHALL verify user owns resume before creating share links
    - **Property 22: Email Service Resilience** - For any email sending failure, the system SHALL retry up to 3 times with exponential backoff before logging failure
    - **Property 23: Rate Limiting - Resume Sharing** - For any user, sharing resumes SHALL be rate limited to 50 recipients per hour to prevent abuse
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.8, 2.10_
  
  - [ ]* 3.6 Write unit tests for sharing endpoint
    - Test successful share link creation and email sending
    - Test authorization failure (user doesn't own resume)
    - Test rate limiting (exceeding 50 recipients per hour)
    - Test invalid email addresses
    - Test share link expiration
    - Test view tracking
    - _Requirements: 2.1, 2.2, 2.4, 2.10, 9.8_

- [ ] 4. Implement Employer Applications Review Interface
  - [ ] 4.1 Create database queries for employer applications
    - Implement `getApplicationsForEmployer(employerId, filters)` function
    - Query JobApplication records for jobs posted by employer
    - Support filtering by job, status, and date range
    - Implement pagination (50 per page)
    - Order by submission date descending
    - Include related data: candidate info, resume, job details
    - _Requirements: 3.1, 3.3, 3.6, 3.7_
  
  - [ ] 4.2 Create API endpoint for fetching employer applications
    - Create `GET /api/employer/applications` endpoint
    - Accept query parameters: page, jobId, status, dateFrom, dateTo
    - Verify user has employer role
    - Call applications query function
    - Return paginated results with total count
    - _Requirements: 3.1, 3.3, 3.6, 9.6_
  
  - [ ] 4.3 Create React component for applications list
    - Build `/app/employer/applications/page.tsx` page component
    - Display applications in table format with columns: candidate name, email, job title, status, application date
    - Implement pagination controls
    - Add filters for job, status, and date range
    - Show loading and error states
    - _Requirements: 3.1, 3.2, 3.6, 12.3_
  
  - [ ] 4.4 Create application detail view component
    - Build component to display full application details
    - Show candidate resume preview
    - Show cover letter if provided
    - Show application timeline and status history
    - _Requirements: 3.2, 3.8_
  
  - [ ] 4.5 Implement application status update functionality
    - Create `PATCH /api/applications/{applicationId}/status` endpoint
    - Accept new status in request body
    - Verify employer owns the job
    - Update application status in database
    - Create audit log entry with previous and new status
    - Send notification to applicant (optional)
    - _Requirements: 3.4, 3.5, 8.1, 8.2_
  
  - [ ] 4.6 Add authorization checks for employer routes
    - Verify user has employer role before accessing /employer routes
    - Verify employer owns jobs before showing applications
    - Return 403 Forbidden if unauthorized
    - _Requirements: 3.3, 3.9, 9.3, 9.6_
  
  - [ ]* 4.7 Write property tests for applications review
    - **Property 7: Application Authorization** - For any employer and job application, querying applications for that employer SHALL only return applications for jobs they posted
    - **Property 8: Application Status Persistence** - For any application status update, the change SHALL be persisted to database and reflected in subsequent queries
    - **Property 9: Audit Log Creation** - For any application status change, an audit log entry SHALL be created recording previous status, new status, user, and timestamp
    - **Property 10: Job Posting Authorization** - For any employer attempting to edit job, system SHALL verify they own job before allowing modifications
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 8.1, 8.2_
  
  - [ ]* 4.8 Write unit tests for applications endpoint
    - Test fetching applications for employer
    - Test authorization failure (employer doesn't own job)
    - Test pagination
    - Test filtering by status and date
    - Test status update
    - Test audit log creation
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 5. Implement Employer Job Posting Workflow
  - [ ] 5.1 Create API endpoint for job posting
    - Create `POST /api/employer/jobs` endpoint
    - Accept job data: title, description, location, requirements, company, salary (optional)
    - Verify user has employer role
    - Validate required fields
    - Create JobOpportunity record with postedById set to employer ID
    - Set creation timestamp and mark as active
    - Return created job with ID
    - _Requirements: 4.2, 4.3, 4.4, 4.7, 4.8_
  
  - [ ] 5.2 Create React page for job posting form
    - Build `/app/employer/jobs/new/page.tsx` page component
    - Create form with fields: title, description, location, requirements, company, salary
    - Implement form validation with error messages
    - Show loading state during submission
    - Show success message after posting
    - _Requirements: 4.1, 4.7, 4.8, 12.4_
  
  - [ ] 5.3 Create API endpoint for editing job postings
    - Create `PATCH /api/employer/jobs/{jobId}` endpoint
    - Accept updated job data
    - Verify employer owns the job
    - Update job details and modification timestamp
    - Return updated job
    - _Requirements: 4.5, 4.6_
  
  - [ ] 5.4 Create React page for editing job postings
    - Build `/app/employer/jobs/{jobId}/edit/page.tsx` page component
    - Fetch existing job data
    - Pre-populate form with current values
    - Allow editing of job details
    - Show success message after update
    - _Requirements: 4.5, 4.6_
  
  - [ ] 5.5 Implement redirect from /jobs/post to /employer/jobs/new
    - Create redirect in routing configuration
    - Ensure /jobs/post redirects to /employer/jobs/new
    - _Requirements: 4.10_
  
  - [ ] 5.6 Add authorization checks for job posting
    - Verify user has employer role
    - Verify employer owns job before editing
    - Return 403 Forbidden if unauthorized
    - _Requirements: 4.6, 9.4_
  
  - [ ]* 5.7 Write property tests for job posting
    - **Property 10: Job Posting Authorization** - For any employer attempting to edit job, system SHALL verify they own job before allowing modifications
    - **Property 11: Job Posting Creation** - For any valid job posting submission, system SHALL create new job opportunity associated with employer's account
    - **Property 29: Job Posting Immutability** - For any job posting, employer association (postedById) SHALL be immutable after creation
    - _Requirements: 4.2, 4.3, 4.6, 11.5_
  
  - [ ]* 5.8 Write unit tests for job posting endpoint
    - Test successful job creation
    - Test authorization failure (user not employer)
    - Test validation errors (missing required fields)
    - Test job editing
    - Test authorization on edit (employer doesn't own job)
    - _Requirements: 4.2, 4.3, 4.6, 4.7, 4.8_

- [ ] 6. Implement Application Withdrawal Service
  - [ ] 6.1 Create withdrawal service function
    - Implement `withdrawApplication(applicationId, userId, reason)` function
    - Fetch application from database
    - Verify user owns the application
    - Verify application status is SUBMITTED
    - Create audit log entry with action WITHDRAWN
    - Update application status to WITHDRAWN
    - Set withdrawnAt timestamp
    - Store withdrawal reason if provided
    - Send notification to employer
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3_
  
  - [ ] 6.2 Create API endpoint for application withdrawal
    - Create `DELETE /api/applications/{applicationId}` endpoint
    - Accept optional reason in request body
    - Verify user is authenticated
    - Call withdrawal service
    - Return success response
    - Handle errors: unauthorized (403), invalid status (400), not found (404)
    - _Requirements: 5.1, 5.2, 5.5, 5.6_
  
  - [ ] 6.3 Add withdrawal button to application UI
    - Add withdraw button to application detail view
    - Show confirmation dialog before processing
    - Accept optional reason from user
    - Call withdrawal API endpoint
    - Show success message
    - Update application status in UI
    - _Requirements: 5.1, 5.5, 12.5_
  
  - [ ] 6.4 Implement employer notification for withdrawal
    - Create notification when application is withdrawn
    - Include applicant name, job title, and withdrawal reason
    - Send to employer via notification system
    - _Requirements: 5.4, 14.1_
  
  - [ ] 6.5 Add 24-hour re-application prevention
    - Check if user has withdrawn application in last 24 hours
    - Prevent re-application within 24-hour window
    - Return 429 Too Many Requests if attempting to re-apply too soon
    - _Requirements: 5.8_
  
  - [ ]* 6.6 Write property tests for application withdrawal
    - **Property 12: Application Withdrawal Status Transition** - For any application in SUBMITTED status, withdrawing it SHALL change status to WITHDRAWN and set withdrawnAt timestamp
    - **Property 13: Withdrawal Audit Logging** - For any application withdrawal, an audit log entry SHALL be created with action type WITHDRAWN and withdrawal reason if provided
    - **Property 14: Withdrawal Authorization** - For any withdrawal request, system SHALL verify applicant owns application before processing
    - **Property 15: Withdrawal Status Validation** - For any application not in SUBMITTED status, attempting to withdraw it SHALL return 400 Bad Request error
    - **Property 16: Withdrawal Atomicity** - For any application withdrawal, status change, timestamp, and audit log creation SHALL occur atomically—all succeed or all fail together
    - **Property 25: Data Integrity - Withdrawal Atomicity** - For any application withdrawal, status, timestamp, and audit log SHALL be updated atomically—if any part fails, all changes rolled back
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 8.1, 8.2, 8.3, 11.1_
  
  - [ ]* 6.7 Write unit tests for withdrawal endpoint
    - Test successful application withdrawal
    - Test authorization failure (user doesn't own application)
    - Test invalid status (application already withdrawn)
    - Test audit log creation
    - Test employer notification
    - Test 24-hour re-application prevention
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.8_

- [ ] 7. Checkpoint - Verify all core features implemented
  - Ensure all API endpoints are created and functional
  - Verify database migrations applied successfully
  - Check that all authorization checks are in place
  - Confirm all required fields are persisted correctly
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 2.1, 3.1, 4.2, 5.1_

- [ ] 8. Implement Performance Optimizations
  - [ ] 8.1 Add database indexes for query performance
    - Index JobApplication by employerId, status, userId
    - Index ResumeShareLink by token and expiresAt
    - Index ApplicationAuditLog by applicationId and createdAt
    - _Requirements: 3.10, 10.2_
  
  - [ ] 8.2 Implement caching for resume HTML
    - Cache generated resume HTML to avoid regeneration
    - Invalidate cache when resume is updated
    - Use Redis or in-memory cache
    - _Requirements: 10.1_
  
  - [ ] 8.3 Implement async job queue for PDF generation
    - Use Bull or similar queue library for PDF generation
    - Process PDF exports asynchronously
    - Return job ID to user for polling
    - _Requirements: 10.5_
  
  - [ ] 8.4 Implement async job queue for email sending
    - Use Bull or similar queue library for email sending
    - Process emails asynchronously
    - Don't block user request during email sending
    - _Requirements: 10.4_
  
  - [ ]* 8.5 Write performance tests
    - Test PDF generation completes within 5 seconds
    - Test applications page loads within 2 seconds
    - Test withdrawal completes within 1 second
    - _Requirements: 1.5, 3.10, 5.10, 10.1, 10.2, 10.3_

- [ ] 9. Implement Error Handling and Resilience
  - [ ] 9.1 Add graceful error handling for PDF generation
    - Catch html2canvas errors
    - Catch jsPDF errors
    - Return 500 with descriptive error message
    - Log errors for debugging
    - _Requirements: 6.6_
  
  - [ ] 9.2 Add graceful error handling for email service
    - Catch SendGrid/Resend API errors
    - Implement retry logic with exponential backoff
    - Log failures and notify user
    - Continue with other recipients on partial failure
    - _Requirements: 2.6, 7.3, 7.8_
  
  - [ ] 9.3 Add graceful error handling for database operations
    - Catch database errors
    - Return 500 with generic error message
    - Log detailed errors for debugging
    - _Requirements: 10.7_
  
  - [ ] 9.4 Implement transaction support for atomic operations
    - Use database transactions for withdrawal operations
    - Ensure status, timestamp, and audit log are updated atomically
    - Rollback all changes if any part fails
    - _Requirements: 11.1, 11.8_

- [ ] 10. Implement Data Validation and Sanitization
  - [ ] 10.1 Add input validation for all API endpoints
    - Validate email addresses
    - Validate required fields
    - Validate field lengths and formats
    - Return 400 with specific error messages
    - _Requirements: 4.7, 4.8_
  
  - [ ] 10.2 Add sanitization for user inputs
    - Sanitize HTML in job descriptions
    - Sanitize email addresses
    - Prevent injection attacks
    - _Requirements: 9.10_
  
  - [ ] 10.3 Add validation for share link tokens
    - Validate token format
    - Validate token expiration
    - Return 404 for invalid or expired tokens
    - _Requirements: 2.5, 9.9_

- [ ] 11. Implement Notification System
  - [ ] 11.1 Create notification service for application events
    - Implement notification creation for withdrawal events
    - Implement notification creation for status change events
    - Store notifications in database
    - _Requirements: 5.4, 14.1, 14.2_
  
  - [ ] 11.2 Create API endpoint for fetching notifications
    - Create `GET /api/notifications` endpoint
    - Return notifications for authenticated user
    - Support pagination and filtering
    - _Requirements: 14.6_
  
  - [ ] 11.3 Add notification UI components
    - Display notifications in user dashboard
    - Show notification count badge
    - Allow marking notifications as read
    - _Requirements: 14.1, 14.2_

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Run all unit tests and verify passing
  - Run all property-based tests and verify passing
  - Run integration tests for end-to-end flows
  - Verify all authorization checks working
  - Verify all rate limiting working
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 2.1, 3.1, 4.2, 5.1, 8.1, 9.1, 10.1, 11.1_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation of core functionality
- Authorization checks are critical security requirements and should not be skipped
- Database migrations must be applied before implementing features
- Rate limiting should be implemented early to prevent abuse
- Async operations (PDF generation, email sending) should use job queues for scalability

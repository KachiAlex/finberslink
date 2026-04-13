# Requirements Document: Critical App Features Fix

## Introduction

This requirements document specifies the functional and non-functional requirements for implementing five critical features in the Finbers Link application. These features address core user workflows that are currently blocked or incomplete: resume PDF export, resume sharing via email, employer application review interface, employer job posting workflow, and application withdrawal functionality. The requirements are derived from the technical design and organized by feature area with acceptance criteria following the EARS (Easy Approach to Requirements Syntax) pattern.

## Glossary

- **Resume User**: A user who creates and manages resumes on the platform
- **Employer**: A user account with employer privileges who posts jobs and reviews applications
- **Job Applicant**: A user who applies for job opportunities posted by employers
- **Admin**: A system administrator with full platform access
- **PDF Template**: A predefined layout for resume rendering (MODERN, CLASSIC, MINIMAL)
- **Share Link**: A unique, time-limited token that allows recipients to view a shared resume
- **Job Application**: A record of a user's application to a specific job opportunity
- **Application Status**: The current state of a job application (SUBMITTED, IN_REVIEW, INTERVIEW, OFFERED, REJECTED, WITHDRAWN)
- **Audit Log**: A record of actions taken on applications for compliance and troubleshooting
- **Email Service**: External service (SendGrid or Resend) for sending transactional emails
- **PDF Generation Service**: Service that converts resume HTML to PDF format using html2canvas and jsPDF
- **Sharing Service**: Service that manages resume share links and email invitations
- **Withdrawal Service**: Service that handles application withdrawal requests and audit logging

## Requirements

### Requirement 1: Resume PDF Export

**User Story:** As a resume user, I want to export my resume as a PDF file, so that I can download and share it in a standard format.

#### Acceptance Criteria

1. WHEN a resume user clicks the export button on a resume THEN the system SHALL generate a valid PDF file containing all resume content
2. WHEN a PDF is generated THEN the system SHALL include all resume sections (contact info, summary, experience, education, skills, certifications)
3. WHEN a resume is exported THEN the system SHALL set proper PDF metadata including title, author, subject, and creation date
4. WHEN a user exports a resume with a photo THEN the system SHALL render the photo in the PDF if the includePhoto option is enabled
5. WHEN a PDF export is requested THEN the system SHALL complete the operation within 5 seconds
6. WHEN a PDF is generated THEN the system SHALL return a non-empty buffer with valid PDF structure
7. WHEN a resume is exported THEN the system SHALL record the export event in the database with timestamp and template type
8. WHEN a user attempts to export a resume they don't own THEN the system SHALL return a 403 Forbidden error

### Requirement 2: Resume Sharing with Email Notifications

**User Story:** As a resume user, I want to share my resume with others via email, so that I can easily send it to potential employers or contacts.

#### Acceptance Criteria

1. WHEN a resume user initiates sharing with one or more recipients THEN the system SHALL create a unique share link for each recipient
2. WHEN share links are created THEN the system SHALL send an invitation email to each recipient containing the share link
3. WHEN an email is sent THEN the system SHALL include the sender's name, resume title, share link URL, and expiration date in the email body
4. WHEN a user shares a resume THEN the system SHALL set an expiration date on the share link (default 7 days, configurable up to 30 days)
5. WHEN a share link expires THEN the system SHALL prevent access to the shared resume and return a 404 error
6. WHEN an email fails to send THEN the system SHALL log the error and continue sending to other recipients without blocking
7. WHEN a recipient views a shared resume THEN the system SHALL increment the view count and record the timestamp
8. WHEN a user shares a resume THEN the system SHALL rate limit to 50 recipients per hour to prevent abuse
9. WHEN a share link is created THEN the system SHALL mark the emailSentAt timestamp after successful delivery
10. WHEN a user attempts to share a resume they don't own THEN the system SHALL return a 403 Forbidden error

### Requirement 3: Employer Applications Review Interface

**User Story:** As an employer, I want to review applications for my posted jobs, so that I can evaluate candidates and manage the hiring process.

#### Acceptance Criteria

1. WHEN an employer navigates to /employer/applications THEN the system SHALL display all applications for jobs they have posted
2. WHEN applications are displayed THEN the system SHALL show candidate name, email, application date, current status, and resume preview
3. WHEN an employer views applications THEN the system SHALL only display applications for jobs they posted (authorization check)
4. WHEN an employer updates an application status THEN the system SHALL persist the change to the database immediately
5. WHEN an application status is updated THEN the system SHALL create an audit log entry recording the change, timestamp, and user
6. WHEN an employer views the applications page THEN the system SHALL display applications paginated at 50 per page
7. WHEN an employer filters applications THEN the system SHALL support filtering by job, status, and date range
8. WHEN an employer views an application THEN the system SHALL display the cover letter if provided by the applicant
9. WHEN an employer attempts to view applications for a job they don't own THEN the system SHALL return a 403 Forbidden error
10. WHEN applications are displayed THEN the system SHALL load within 2 seconds for typical employer with 100+ applications

### Requirement 4: Employer Job Posting Workflow

**User Story:** As an employer, I want to post job opportunities directly from my employer dashboard, so that I can manage my job postings without accessing the admin interface.

#### Acceptance Criteria

1. WHEN an employer navigates to /employer/jobs/new THEN the system SHALL display a job posting form with all required fields
2. WHEN an employer submits a job posting THEN the system SHALL create a new job opportunity in the database
3. WHEN a job is posted THEN the system SHALL associate it with the employer's account (postedById field)
4. WHEN a job posting is created THEN the system SHALL set the creation timestamp and mark it as active
5. WHEN an employer edits a job posting THEN the system SHALL update the job details and record the modification timestamp
6. WHEN an employer attempts to edit a job they don't own THEN the system SHALL return a 403 Forbidden error
7. WHEN a job posting form is submitted THEN the system SHALL validate all required fields (title, description, location, requirements)
8. WHEN a job posting is invalid THEN the system SHALL return validation errors with specific field messages
9. WHEN an employer posts a job THEN the system SHALL make it immediately visible to job applicants
10. WHEN an employer navigates to /jobs/post THEN the system SHALL redirect to /employer/jobs/new

### Requirement 5: Application Withdrawal

**User Story:** As a job applicant, I want to withdraw my application from a job posting, so that I can manage my applications if circumstances change.

#### Acceptance Criteria

1. WHEN an applicant clicks the withdraw button on an application THEN the system SHALL change the application status to WITHDRAWN
2. WHEN an application is withdrawn THEN the system SHALL set the withdrawnAt timestamp to the current time
3. WHEN an application is withdrawn THEN the system SHALL create an audit log entry recording the withdrawal action
4. WHEN an application is withdrawn THEN the system SHALL send a notification to the employer about the withdrawal
5. WHEN an applicant attempts to withdraw an application THEN the system SHALL verify they own the application (authorization check)
6. WHEN an applicant attempts to withdraw a non-SUBMITTED application THEN the system SHALL return a 400 Bad Request error
7. WHEN an application is withdrawn THEN the system SHALL store the withdrawal reason if provided by the applicant
8. WHEN an applicant withdraws an application THEN the system SHALL prevent re-application for 24 hours
9. WHEN an application is withdrawn THEN the system SHALL remove it from the employer's active applications list
10. WHEN a withdrawal request is processed THEN the system SHALL complete within 1 second

### Requirement 6: PDF Generation Service Implementation

**User Story:** As a system, I need to generate valid PDF files from resume HTML, so that users can export resumes in a portable format.

#### Acceptance Criteria

1. THE PDF Generation Service SHALL use html2canvas to convert resume HTML to canvas format
2. THE PDF Generation Service SHALL use jsPDF to convert canvas to PDF format
3. WHEN html2canvas is called THEN the system SHALL set scale to 2 for high-quality output
4. WHEN html2canvas is called THEN the system SHALL enable CORS and allow tainted canvas for embedded images
5. WHEN a PDF is created THEN the system SHALL set orientation to portrait and format to A4
6. WHEN PDF generation fails THEN the system SHALL log the error and return a 500 Internal Server Error
7. THE PDF Generation Service SHALL handle resume templates (MODERN, CLASSIC, MINIMAL) correctly
8. WHEN a PDF is generated THEN the system SHALL validate the output buffer is non-empty before returning

### Requirement 7: Email Sharing Service Implementation

**User Story:** As a system, I need to send resume share invitations via email, so that users can easily share resumes with recipients.

#### Acceptance Criteria

1. THE Email Sharing Service SHALL use SendGrid or Resend API for email delivery
2. WHEN an email is sent THEN the system SHALL use the configured email service (SENDGRID_API_KEY or RESEND_API_KEY)
3. WHEN an email fails to send THEN the system SHALL retry up to 3 times with exponential backoff
4. WHEN an email is successfully sent THEN the system SHALL update the share link with emailSentAt timestamp
5. WHEN an email is sent THEN the system SHALL include a valid, clickable share URL in the email body
6. WHEN an email is sent THEN the system SHALL include the expiration date in a user-friendly format
7. WHEN an email is sent THEN the system SHALL use a professional HTML template with branding
8. WHEN email sending fails after retries THEN the system SHALL log the failure and notify the user

### Requirement 8: Application Audit Logging

**User Story:** As an administrator, I want to track all changes to job applications, so that I can maintain compliance and troubleshoot issues.

#### Acceptance Criteria

1. WHEN an application status changes THEN the system SHALL create an audit log entry with the previous and new status
2. WHEN an application is withdrawn THEN the system SHALL create an audit log entry with action type WITHDRAWN
3. WHEN an audit log is created THEN the system SHALL record the user ID, timestamp, and action type
4. WHEN an audit log is created THEN the system SHALL store the withdrawal reason if provided
5. WHEN an audit log is created THEN the system SHALL store metadata as JSON for extensibility
6. WHEN an audit log is queried THEN the system SHALL return entries ordered by creation date descending
7. WHEN an audit log is created THEN the system SHALL link it to the corresponding job application

### Requirement 9: Authorization and Security

**User Story:** As a system, I need to enforce proper authorization checks, so that users can only access and modify their own data.

#### Acceptance Criteria

1. WHEN a user attempts to export a resume THEN the system SHALL verify they own the resume
2. WHEN a user attempts to share a resume THEN the system SHALL verify they own the resume
3. WHEN an employer attempts to view applications THEN the system SHALL verify they own the jobs
4. WHEN an employer attempts to edit a job THEN the system SHALL verify they own the job
5. WHEN an applicant attempts to withdraw an application THEN the system SHALL verify they own the application
6. WHEN a user attempts to access /employer routes THEN the system SHALL verify they have employer role
7. WHEN a PDF export is requested THEN the system SHALL rate limit to 5 exports per minute per user
8. WHEN resume sharing is requested THEN the system SHALL rate limit to 50 recipients per hour per user
9. WHEN a share link is accessed THEN the system SHALL validate the token format and expiration
10. WHEN sensitive data is logged THEN the system SHALL encrypt or redact personally identifiable information

### Requirement 10: Performance and Reliability

**User Story:** As a user, I want the application to be fast and reliable, so that I can efficiently manage my resumes and applications.

#### Acceptance Criteria

1. WHEN a PDF is generated THEN the system SHALL complete within 5 seconds
2. WHEN applications are loaded THEN the system SHALL display within 2 seconds for typical employer
3. WHEN a withdrawal request is processed THEN the system SHALL complete within 1 second
4. WHEN an email is sent THEN the system SHALL not block the user's request (async operation)
5. WHEN multiple PDF exports are requested THEN the system SHALL queue them to prevent resource exhaustion
6. WHEN the email service is unavailable THEN the system SHALL gracefully degrade and retry later
7. WHEN a database query fails THEN the system SHALL return a 500 error with a generic message
8. WHEN a user withdraws an application THEN the system SHALL ensure the operation is atomic (all or nothing)
9. WHEN applications are displayed THEN the system SHALL implement pagination to handle large datasets
10. WHEN share links are created THEN the system SHALL use database transactions to ensure consistency

### Requirement 11: Data Integrity and Consistency

**User Story:** As a system, I need to maintain data integrity across all operations, so that the application state remains consistent.

#### Acceptance Criteria

1. WHEN an application is withdrawn THEN the system SHALL ensure the status, timestamp, and audit log are all updated atomically
2. WHEN a share link is created THEN the system SHALL ensure the link, email, and timestamp are all recorded consistently
3. WHEN a PDF is exported THEN the system SHALL not modify the underlying resume data
4. WHEN an application status is updated THEN the system SHALL prevent concurrent updates from causing conflicts
5. WHEN a job is posted THEN the system SHALL ensure the employer association is immutable
6. WHEN an audit log is created THEN the system SHALL ensure it cannot be modified or deleted
7. WHEN a share link expires THEN the system SHALL prevent access even if the link record still exists
8. WHEN an application is withdrawn THEN the system SHALL prevent status changes after withdrawal

### Requirement 12: User Interface and Experience

**User Story:** As a user, I want clear, intuitive interfaces for all new features, so that I can easily use them without confusion.

#### Acceptance Criteria

1. WHEN a resume user exports a resume THEN the system SHALL provide clear feedback (success message or error)
2. WHEN a resume user shares a resume THEN the system SHALL show a confirmation with recipient count and expiration date
3. WHEN an employer views applications THEN the system SHALL display them in a clear, organized table or list
4. WHEN an employer posts a job THEN the system SHALL provide form validation feedback for required fields
5. WHEN an applicant withdraws an application THEN the system SHALL show a confirmation dialog before processing
6. WHEN a user encounters an error THEN the system SHALL display a user-friendly error message
7. WHEN a PDF export is in progress THEN the system SHALL show a loading indicator
8. WHEN email sending is in progress THEN the system SHALL show progress feedback to the user

### Requirement 13: Integration with Existing Systems

**User Story:** As a system, I need to integrate seamlessly with existing components, so that new features work cohesively with the platform.

#### Acceptance Criteria

1. WHEN a resume is exported THEN the system SHALL use existing resume data models and templates
2. WHEN an application is withdrawn THEN the system SHALL use existing job application data model
3. WHEN an employer posts a job THEN the system SHALL use existing job opportunity data model
4. WHEN an email is sent THEN the system SHALL use existing email configuration and templates
5. WHEN an application is reviewed THEN the system SHALL use existing user and resume relationships
6. WHEN a share link is created THEN the system SHALL use existing ResumeShareLink data model
7. WHEN an audit log is created THEN the system SHALL use new ApplicationAuditLog data model
8. WHEN an application status changes THEN the system SHALL maintain compatibility with existing status values

### Requirement 14: Notification System

**User Story:** As a user, I want to receive timely notifications about important events, so that I can stay informed about my applications and job postings.

#### Acceptance Criteria

1. WHEN an application is withdrawn THEN the system SHALL send a notification to the employer
2. WHEN a resume is shared THEN the system SHALL send an email to the recipient with the share link
3. WHEN an application status is updated THEN the system SHALL optionally notify the applicant (if configured)
4. WHEN a notification is sent THEN the system SHALL include relevant context (applicant name, job title, etc.)
5. WHEN a notification fails to send THEN the system SHALL log the failure and retry later
6. WHEN a user receives a notification THEN the system SHALL provide a way to view the related application or job

### Requirement 15: Data Migration and Backward Compatibility

**User Story:** As a system, I need to handle data migration smoothly, so that existing data remains valid and accessible.

#### Acceptance Criteria

1. WHEN the system is deployed THEN the database schema SHALL be updated with new fields (withdrawnAt, withdrawalReason)
2. WHEN existing applications are queried THEN the system SHALL handle missing withdrawal fields gracefully
3. WHEN a new audit log table is created THEN the system SHALL not affect existing application records
4. WHEN the system is rolled back THEN the new fields SHALL be optional to prevent errors
5. WHEN existing share links are queried THEN the system SHALL handle missing emailSentAt field gracefully


# Requirements Document: High-Priority App Features Fix

## Introduction

This requirements document specifies the functional and non-functional requirements for implementing four high-priority features in the Finbers Link application:

1. **Resume Publishing** - Enable users to publish resumes to public profiles with shareable URLs
2. **Email Sending for Resume Shares** - Complete the email implementation for resume share invitations
3. **Company Profile Pages** - Implement company profiles displaying job listings and statistics
4. **Navigation Links & Admin Settings** - Create employer job posting pages and admin settings interface

These features address critical gaps in the application that are blocking important user workflows. The requirements are derived from the technical design and organized by feature area, with acceptance criteria following the EARS (Easy Approach to Requirements Syntax) pattern.

## Glossary

- **Resume User**: A user who creates and manages resumes on the platform
- **Employer**: A user with EMPLOYER role who posts job opportunities
- **Admin**: A user with ADMIN role who manages system configuration
- **Public User**: An unauthenticated user accessing public resume or company profiles
- **Resume Publishing**: The process of making a resume publicly accessible via a unique URL
- **Share Link**: A time-limited token that allows recipients to view a specific resume
- **Company Profile**: A public page displaying company information, job listings, and statistics
- **Public ID**: A unique identifier used in public URLs for resumes (e.g., xyz789 in /public/resumes/xyz789)
- **Share Token**: A unique, non-reusable token embedded in share links
- **Visibility**: The access level of a resume (PUBLIC or PRIVATE)
- **Atomic Operation**: A database operation that either completes fully or not at all
- **Email Service**: SendGrid or Resend API for sending emails
- **Job Opportunity**: A job posting created by an employer
- **System Settings**: Configuration options for email, rate limits, and feature flags
- **Admin Statistics**: Aggregated metrics about users, jobs, applications, and resumes

## Requirements

### Requirement 1: Resume Publishing

**User Story:** As a Resume User, I want to publish my resume to a public profile with a shareable URL, so that I can share my qualifications with potential employers and recruiters without requiring them to create an account.

#### Acceptance Criteria

1. WHEN a Resume User clicks the "Publish Resume" button THEN the system SHALL create a ResumePublishing record with a unique publicId and set the published flag to true
2. WHEN a resume is published THEN the system SHALL generate a public URL in the format `/public/resumes/[publicId]` and return it to the user
3. WHEN a resume is published THEN the system SHALL update the resume's visibility field to PUBLIC
4. WHEN a Resume User publishes the same resume multiple times THEN the system SHALL return the same publicId and publicUrl (idempotent operation)
5. WHEN a Resume User accesses the public resume URL THEN the system SHALL display the resume content without requiring authentication
6. WHEN a Resume User attempts to publish a resume they do not own THEN the system SHALL return a 403 Forbidden error
7. WHEN a Resume User publishes a resume THEN the system SHALL complete the operation within 1 second
8. WHEN a Resume User publishes a resume THEN the system SHALL record the publishedAt timestamp
9. WHEN a Resume User unpublishes a resume THEN the system SHALL set the published flag to false and record the unpublishedAt timestamp
10. WHEN a public user accesses an unpublished resume's public URL THEN the system SHALL return a 404 Not Found error

### Requirement 2: Email Sending for Resume Shares

**User Story:** As a Resume User, I want to share my resume with specific people via email, so that I can easily distribute my qualifications to targeted recipients without requiring them to search for my profile.

#### Acceptance Criteria

1. WHEN a Resume User creates a resume share link THEN the system SHALL automatically send an invitation email to the specified recipient(s)
2. WHEN an invitation email is sent THEN the system SHALL include the share link URL and expiration date in the email body
3. WHEN an invitation email is sent THEN the system SHALL update the ResumeShareLink record with an emailSentAt timestamp
4. WHEN a Resume User shares a resume with multiple recipients THEN the system SHALL send emails to all recipients and return the count of successfully sent emails
5. WHEN an email sending operation fails THEN the system SHALL retry up to 3 times with exponential backoff before logging the failure
6. WHEN a Resume User attempts to share a resume they do not own THEN the system SHALL return a 403 Forbidden error
7. WHEN a Resume User sends share invitations THEN the system SHALL complete the operation within 5 seconds
8. WHEN a share link is created THEN the system SHALL generate a unique, non-reusable shareToken
9. WHEN a recipient accesses a share link after the expiration date THEN the system SHALL return a 404 error
10. WHEN an invalid email address is provided THEN the system SHALL skip that recipient and continue processing other recipients
11. WHEN a Resume User provides a custom message with the share invitation THEN the system SHALL include that message in the email body
12. WHEN an email sending operation encounters an invalid email format THEN the system SHALL validate the format before attempting to send

### Requirement 3: Company Profile Pages

**User Story:** As a Public User or Employer, I want to view company profiles with job listings and statistics, so that I can learn about companies and their current opportunities.

#### Acceptance Criteria

1. WHEN a user accesses a company profile page at `/companies/[slug]` THEN the system SHALL display the company name, logo, description, industry, location, and website
2. WHEN a company profile page loads THEN the system SHALL display all active job postings for that company
3. WHEN a company profile page loads THEN the system SHALL display company statistics including the number of active jobs, total applications, and profile views
4. WHEN a user accesses a company profile THEN the system SHALL query jobs by the company's ID and return only active jobs
5. WHEN a user accesses a company profile THEN the system SHALL increment the company's viewCount by exactly 1
6. WHEN a company has no active jobs THEN the system SHALL display an empty state message instead of a blank job list
7. WHEN a user accesses a company profile page THEN the system SHALL complete the page load within 2 seconds
8. WHEN a public user accesses a company profile THEN the system SHALL allow access without requiring authentication
9. WHEN a company profile is accessed THEN the system SHALL calculate statistics accurately reflecting the current state of jobs and applications
10. WHEN a company slug does not exist THEN the system SHALL return a 404 Not Found error

### Requirement 4: Admin Settings Page

**User Story:** As an Admin, I want to access a centralized admin settings page, so that I can manage system configuration, view admin statistics, and configure email and feature settings.

#### Acceptance Criteria

1. WHEN an Admin accesses `/admin/settings` THEN the system SHALL display the admin settings page
2. WHEN a non-Admin user attempts to access `/admin/settings` THEN the system SHALL return a 403 Forbidden error or redirect to the dashboard
3. WHEN an Admin accesses the settings page THEN the system SHALL display system configuration options including email settings, rate limits, and feature flags
4. WHEN an Admin accesses the settings page THEN the system SHALL display admin statistics including total users, total jobs, total applications, and total resumes
5. WHEN an Admin updates system settings THEN the system SHALL persist the changes to the database
6. WHEN an Admin updates email settings THEN the system SHALL validate the configuration before saving
7. WHEN an Admin accesses the settings page THEN the system SHALL verify the user has the ADMIN role before granting access

### Requirement 5: Employer Job Posting Workflow

**User Story:** As an Employer, I want to post and manage job opportunities through a dedicated employer interface, so that I can easily create and edit job postings without accessing the admin panel.

#### Acceptance Criteria

1. WHEN an Employer accesses `/employer/jobs` THEN the system SHALL display a list of all jobs posted by that employer
2. WHEN an Employer accesses `/employer/jobs/new` THEN the system SHALL display a job posting form
3. WHEN an Employer submits a job posting form THEN the system SHALL create a JobOpportunity record with postedById set to the employer's ID and companyId set to the employer's company
4. WHEN an Employer attempts to post a job without the EMPLOYER role THEN the system SHALL return a 403 Forbidden error
5. WHEN a user accesses `/jobs/post` THEN the system SHALL redirect to `/employer/jobs/new` for employers
6. WHEN an Employer attempts to edit a job they do not own THEN the system SHALL return a 403 Forbidden error
7. WHEN an Employer edits a job posting THEN the system SHALL update the JobOpportunity record and persist changes to the database
8. WHEN an Employer accesses `/employer/jobs/[jobId]/edit` THEN the system SHALL display the job editing form pre-populated with current job data
9. WHEN a job is created by an Employer THEN the system SHALL set the postedById field to the employer's ID (immutable after creation)
10. WHEN a job is created THEN the system SHALL link it to the employer's company via the companyId field

### Requirement 6: Resume Publishing Data Persistence

**User Story:** As a system, I want to reliably store and retrieve resume publishing information, so that published resumes remain accessible and publishing state is maintained accurately.

#### Acceptance Criteria

1. WHEN a resume is published THEN the system SHALL create a ResumePublishing record with all required fields (resumeId, publicId, published, publishedAt)
2. WHEN a resume is published THEN the system SHALL ensure the publicId is unique across all published resumes
3. WHEN a resume is published THEN the system SHALL store the publishedAt timestamp in ISO 8601 format
4. WHEN a resume is unpublished THEN the system SHALL update the unpublishedAt timestamp
5. WHEN a resume is viewed THEN the system SHALL increment the viewCount by 1 and update lastViewedAt timestamp
6. WHEN a ResumePublishing record is created THEN the system SHALL perform the operation atomically with the Resume visibility update

### Requirement 7: Share Link Data Persistence

**User Story:** As a system, I want to reliably store and retrieve share link information, so that share links remain valid and email tracking is maintained.

#### Acceptance Criteria

1. WHEN a share link is created THEN the system SHALL store the shareToken, recipientEmail, senderId, expiresAt, and createdAt fields
2. WHEN a share link is created THEN the system SHALL ensure the shareToken is unique and cannot be reused
3. WHEN an email is sent for a share link THEN the system SHALL update the emailSentAt timestamp
4. WHEN a share link is accessed THEN the system SHALL increment the viewCount by 1 and update lastViewedAt timestamp
5. WHEN a share link is revoked THEN the system SHALL set the revokedAt timestamp and prevent further access

### Requirement 8: Company Profile Data Persistence

**User Story:** As a system, I want to reliably store and retrieve company profile information, so that company data remains consistent and accessible.

#### Acceptance Criteria

1. WHEN a company profile is accessed THEN the system SHALL retrieve company data including name, logo, description, industry, location, and website
2. WHEN a company profile is accessed THEN the system SHALL increment the viewCount by 1
3. WHEN a company profile is accessed THEN the system SHALL query all active JobOpportunity records linked to that company via companyId
4. WHEN a JobOpportunity is created THEN the system SHALL link it to a company via the companyId field
5. WHEN company statistics are calculated THEN the system SHALL accurately count active jobs, total applications, and profile views

### Requirement 9: Authorization and Access Control

**User Story:** As a system, I want to enforce proper authorization checks, so that users can only access and modify resources they own or have permission to manage.

#### Acceptance Criteria

1. WHEN a Resume User attempts to publish a resume THEN the system SHALL verify the user owns the resume before allowing the operation
2. WHEN a Resume User attempts to share a resume THEN the system SHALL verify the user owns the resume before creating share links
3. WHEN an Employer attempts to post a job THEN the system SHALL verify the user has the EMPLOYER role
4. WHEN an Employer attempts to edit a job THEN the system SHALL verify the user owns the job (postedById matches userId)
5. WHEN a user attempts to access `/admin/settings` THEN the system SHALL verify the user has the ADMIN role
6. WHEN a user attempts to access employer routes THEN the system SHALL verify the user has the EMPLOYER role
7. WHEN a public user accesses a published resume or company profile THEN the system SHALL allow access without authentication

### Requirement 10: Performance and Responsiveness

**User Story:** As a user, I want the application to respond quickly to my actions, so that I have a smooth and responsive experience.

#### Acceptance Criteria

1. WHEN a Resume User publishes a resume THEN the system SHALL complete the operation within 1 second
2. WHEN a Resume User sends share invitations THEN the system SHALL complete the operation within 5 seconds
3. WHEN a user loads a company profile page THEN the system SHALL complete the page load within 2 seconds
4. WHEN a user accesses the admin settings page THEN the system SHALL load the page within 2 seconds
5. WHEN an Employer accesses their job list THEN the system SHALL load the page within 2 seconds
6. WHEN the system queries company jobs THEN the system SHALL use database indexes on companyId for efficient lookups
7. WHEN company profiles are accessed frequently THEN the system SHALL implement caching to reduce database queries

### Requirement 11: Data Integrity and Atomicity

**User Story:** As a system, I want to maintain data consistency and integrity, so that operations either complete fully or not at all, preventing partial or corrupted state.

#### Acceptance Criteria

1. WHEN a resume is published THEN the system SHALL perform the ResumePublishing record creation and Resume visibility update atomically
2. WHEN a share link is created THEN the system SHALL ensure the shareToken is unique and not reusable
3. WHEN a company profile is accessed THEN the system SHALL increment the viewCount by exactly 1 (no race conditions)
4. WHEN a resume is published THEN the system SHALL not modify the underlying resume data (title, summary, content remain unchanged)
5. WHEN a job is created by an Employer THEN the system SHALL set the postedById field immutably (cannot be changed after creation)
6. WHEN multiple operations occur simultaneously THEN the system SHALL use database transactions to prevent race conditions

### Requirement 12: Email Service Integration

**User Story:** As a system, I want to reliably send emails through configured email services, so that users receive share invitations and notifications.

#### Acceptance Criteria

1. WHEN an email is sent THEN the system SHALL use the configured email service (SendGrid or Resend)
2. WHEN an email sending operation fails THEN the system SHALL log the error with details for debugging
3. WHEN an email sending operation fails THEN the system SHALL retry up to 3 times with exponential backoff
4. WHEN an email is sent THEN the system SHALL include the sender's name, resume title, share URL, and expiration date
5. WHEN an email is sent THEN the system SHALL use the from address 'noreply@finbers-link.com'
6. WHEN an email sending operation encounters a rate limit THEN the system SHALL implement rate limiting (50 emails per hour per user)
7. WHEN an email is sent THEN the system SHALL validate the recipient email format before sending

### Requirement 13: Security and Data Protection

**User Story:** As a system, I want to protect user data and prevent unauthorized access, so that user information remains secure and private.

#### Acceptance Criteria

1. WHEN a share link is created THEN the system SHALL generate a cryptographically secure shareToken
2. WHEN a public resume is accessed THEN the system SHALL not expose sensitive user information (email, phone, address)
3. WHEN a user accesses admin or employer routes THEN the system SHALL verify authentication and authorization before granting access
4. WHEN a company slug is accessed THEN the system SHALL validate the slug to prevent path traversal attacks
5. WHEN email addresses are stored THEN the system SHALL validate the format before storing
6. WHEN sensitive data is logged THEN the system SHALL encrypt or redact sensitive information in audit logs
7. WHEN a share link is revoked THEN the system SHALL prevent further access to that link

### Requirement 14: Error Handling and Recovery

**User Story:** As a system, I want to handle errors gracefully and provide clear feedback, so that users understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN a Resume User tries to publish a non-existent resume THEN the system SHALL return a 404 error with message "Resume not found"
2. WHEN a Resume User tries to publish a resume they don't own THEN the system SHALL return a 403 error with message "Unauthorized"
3. WHEN an email service is unavailable THEN the system SHALL return a 500 error with message "Failed to send emails" and log the error
4. WHEN an invalid email address is provided THEN the system SHALL skip that recipient and continue with others
5. WHEN a company slug doesn't exist THEN the system SHALL return a 404 error with message "Company not found"
6. WHEN a non-Admin accesses admin settings THEN the system SHALL return a 403 error or redirect to dashboard
7. WHEN a non-Employer tries to post a job THEN the system SHALL return a 403 error with message "Unauthorized"

### Requirement 15: Navigation and Routing

**User Story:** As a user, I want clear navigation paths to access features, so that I can easily find and use the functionality I need.

#### Acceptance Criteria

1. WHEN a user accesses `/jobs/post` THEN the system SHALL redirect to `/employer/jobs/new` for employers
2. WHEN an Employer accesses `/employer/jobs` THEN the system SHALL display their job listings
3. WHEN an Employer accesses `/employer/jobs/new` THEN the system SHALL display the job posting form
4. WHEN an Employer accesses `/employer/jobs/[jobId]/edit` THEN the system SHALL display the job editing form
5. WHEN an Admin accesses `/admin/settings` THEN the system SHALL display the admin settings page
6. WHEN a user accesses `/companies/[slug]` THEN the system SHALL display the company profile page
7. WHEN a public user accesses `/public/resumes/[publicId]` THEN the system SHALL display the published resume

### Requirement 16: User Interface and Experience

**User Story:** As a user, I want a clear and intuitive interface, so that I can easily understand how to use each feature.

#### Acceptance Criteria

1. WHEN a Resume User publishes a resume THEN the system SHALL display the public URL in a copyable format
2. WHEN a Resume User shares a resume THEN the system SHALL display a confirmation message with the number of emails sent
3. WHEN a company profile has no active jobs THEN the system SHALL display an empty state message
4. WHEN an Employer views their job list THEN the system SHALL display job status, creation date, and application count
5. WHEN an Admin accesses settings THEN the system SHALL organize settings into logical sections (email, rate limits, features)
6. WHEN a user accesses a company profile THEN the system SHALL display company information prominently with job listings below

### Requirement 17: Logging and Monitoring

**User Story:** As a system operator, I want to monitor system activity and troubleshoot issues, so that I can maintain system health and resolve problems quickly.

#### Acceptance Criteria

1. WHEN a resume is published THEN the system SHALL log the action with userId, resumeId, and timestamp
2. WHEN an email is sent THEN the system SHALL log the action with recipient email, shareLink ID, and timestamp
3. WHEN an email sending fails THEN the system SHALL log the error with details for debugging
4. WHEN a company profile is accessed THEN the system SHALL log the action with company ID and timestamp
5. WHEN a job is created THEN the system SHALL log the action with employerId, jobId, and timestamp
6. WHEN admin settings are updated THEN the system SHALL log the action with adminId, changed fields, and timestamp

### Requirement 18: Backward Compatibility

**User Story:** As a system, I want to maintain backward compatibility with existing features, so that existing functionality continues to work as users transition to new features.

#### Acceptance Criteria

1. WHEN existing resume sharing functionality is used THEN the system SHALL continue to work without modification
2. WHEN existing job posting functionality is used THEN the system SHALL continue to work without modification
3. WHEN existing company data is accessed THEN the system SHALL continue to work without modification
4. WHEN new fields are added to data models THEN the system SHALL provide default values for existing records


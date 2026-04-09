# Implementation Plan: Resume Completion Feature

## Overview

This implementation plan breaks down the Resume Completion Feature into discrete, manageable coding tasks organized in logical phases. The feature extends the existing resume system with PDF export, advanced sharing, versioning, analytics, and notifications. Tasks are sequenced to enable incremental validation and early error detection through automated testing.

## Phase 1: Database Schema and Migrations

- [x] 1. Create Prisma schema migrations for new models
  - Create migration file for ResumeShareLink model
  - Create migration file for ResumeVersion model
  - Create migration file for ResumeExport model
  - Create migration file for ResumeView model
  - Create migration file for ResumeNotification model
  - Create migration file for NotificationPreference model
  - Add relationships to existing Resume model
  - _Requirements: 2.8, 3.2, 4.2, 5.1, 6.1, 10.1_

- [x] 2. Create database indexes for performance
  - Add index on ResumeShareLink(resumeId)
  - Add index on ResumeShareLink(shareToken)
  - Add index on ResumeShareLink(expiresAt)
  - Add index on ResumeVersion(resumeId, createdAt)
  - Add index on ResumeExport(resumeId, createdAt)
  - Add index on ResumeView(resumeId, createdAt)
  - Add index on ResumeNotification(userId, createdAt)
  - _Requirements: 5.3, 6.4_

- [x] 3. Checkpoint - Verify database migrations
  - Run migrations against test database
  - Verify all tables and indexes created successfully
  - Confirm schema matches design specifications

## Phase 2: PDF Generation Service

- [x] 4. Implement PDF generation core service
  - Create PdfGenerationService class with template support
  - Implement generatePDF method for Modern, Classic, Minimal templates
  - Implement HTML to PDF conversion using puppeteer/pdfkit
  - Add font embedding for consistent rendering
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3_

- [x] 5. Implement PDF content rendering
  - Create template renderers for each template type
  - Implement resume section rendering (summary, experience, education, projects, skills)
  - Add contact information header rendering
  - Implement image inclusion with compression
  - _Requirements: 1.4, 1.5, 7.5, 7.6_

- [x] 6. Implement file optimization and metadata
  - Add file size optimization to keep PDFs under 5MB
  - Implement PDF metadata embedding (title, author, creation date)
  - Add hyperlink preservation in PDF output
  - Implement filename generation with format: {firstName}_{lastName}_{template}_{timestamp}.pdf
  - _Requirements: 1.6, 7.4, 7.8_

- [x] 7. Implement ATS-optimized export
  - Create generateATSExport method for plain text output
  - Implement standard section header formatting (EXPERIENCE, EDUCATION, SKILLS, PROJECTS)
  - Remove all formatting, colors, and images from ATS output
  - Add ATS-optimized note at top of document
  - Implement UTF-8 encoding and .txt file format
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

- [x] 8. Implement export history recording
  - Create recordExport method to store export metadata
  - Implement export history retrieval with filtering
  - Add export statistics calculation (total exports, most used template, frequency)
  - Implement download count tracking
  - _Requirements: 1.8, 5.1, 5.2, 5.4, 5.8_

- [x] 9. Implement export history API endpoints
  - Create POST /api/resumes/{resumeId}/export endpoint
  - Create GET /api/resumes/{resumeId}/export-history endpoint with filtering
  - Create GET /api/resumes/{resumeId}/export-statistics endpoint
  - Add error handling for invalid resume data and template selection
  - _Requirements: 1.7, 5.3, 5.5_

- [ ]* 10. Write property tests for PDF generation
  - **Property 1: PDF Export Completeness** - Verify all resume sections appear in PDF
  - **Property 2: Template Rendering Consistency** - Verify template-specific formatting
  - **Property 15: PDF File Size Optimization** - Verify file size under 5MB
  - Test with random resume data and template combinations
  - _Requirements: 1.1, 1.2, 7.4_

- [ ]* 11. Write property tests for ATS export
  - **Property 16: ATS Export Format Compliance** - Verify plain text format with standard headers
  - **Property 17: ATS Content Preservation** - Verify all content preserved without loss
  - Test with random resume content
  - _Requirements: 9.1, 9.7_

- [ ]* 12. Write unit tests for PDF generation
  - Test PDF generation with each template type
  - Test PDF generation with missing optional fields
  - Test filename generation with various user names
  - Test file size optimization
  - Test metadata embedding
  - _Requirements: 1.1, 1.2, 1.6_

- [x] 13. Checkpoint - Verify PDF generation works end-to-end
  - Generate sample PDFs with each template
  - Verify file sizes and content
  - Verify export history is recorded correctly

## Phase 3: Sharing Service and Share Link Management

- [x] 14. Implement sharing service core
  - Create SharingService class with share link generation
  - Implement createShareLink method with token generation
  - Implement cryptographically secure token generation
  - Add expiration timestamp calculation with default 30-day expiration
  - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.8_

- [ ] 15. Implement share link validation and access control
  - Create validateShareToken method for expiration checking
  - Implement revocation checking
  - Add 403 Forbidden response for expired/revoked links
  - Implement share link extension functionality
  - _Requirements: 3.3, 3.4, 3.6, 3.7_

- [-] 16. Implement share link management endpoints
  - Create POST /api/resumes/{resumeId}/share endpoint
  - Create GET /api/resumes/{resumeId}/share-links endpoint
  - Create PATCH /api/share-links/{shareToken}/extend endpoint
  - Create DELETE /api/share-links/{shareToken} endpoint
  - Add request validation and error handling
  - _Requirements: 2.1, 2.8, 3.1, 3.6, 3.7_

- [ ] 17. Implement public resume view endpoint
  - Create GET /api/resumes/{resumeId}/view/{shareToken} endpoint (public, no auth)
  - Implement share token validation before rendering
  - Add view recording trigger (async)
  - Return resume data for display
  - _Requirements: 2.6, 6.1_

- [ ] 18. Implement email sending for share invitations
  - Create email template for share invitations
  - Implement sendShareInvitation method
  - Add personalized message support
  - Include resume title and sender name in subject line
  - Implement batch email sending for multiple recipients
  - _Requirements: 2.4, 2.5_

- [ ]* 19. Write property tests for sharing
  - **Property 3: Share Token Uniqueness** - Verify all tokens are unique
  - **Property 4: Share Link Format Compliance** - Verify URL format matches specification
  - **Property 5: Expiration Enforcement** - Verify expired links return 403
  - **Property 6: Expiration Calculation Accuracy** - Verify expiration timestamp accuracy
  - **Property 7: Default Expiration Application** - Verify 30-day default applied
  - **Property 20: Share Link Revocation Enforcement** - Verify revoked links return 403
  - Test with random expiration durations and token counts
  - _Requirements: 2.2, 2.3, 3.2, 3.3, 3.8_

- [ ]* 20. Write unit tests for sharing service
  - Test share link creation with valid email addresses
  - Test share link creation with multiple recipients
  - Test expiration timestamp calculation
  - Test share link revocation
  - Test share link extension
  - Test invalid email format handling
  - _Requirements: 2.1, 2.2, 3.1, 3.6, 3.7_

- [ ] 21. Checkpoint - Verify sharing functionality works end-to-end
  - Create share links with various expiration durations
  - Verify emails are sent correctly
  - Verify public resume view works
  - Verify expiration enforcement

## Phase 4: Versioning Service

- [x] 22. Implement versioning service core
  - Create VersioningService class
  - Implement createVersion method for automatic snapshots
  - Store complete resume data snapshot in JSON format
  - Record timestamp, user ID, and change description
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 23. Implement version history retrieval and restoration
  - Create getVersionHistory method with reverse chronological ordering
  - Implement restoreVersion method to replace current resume with version data
  - Create new version snapshot before restoration
  - Add version number tracking
  - _Requirements: 4.4, 4.5, 4.6_

- [ ] 24. Implement version archival and cleanup
  - Create archiveOldVersions method to keep 50 most recent versions
  - Implement automatic archival trigger on version creation
  - Add 90-day retention for deleted resume versions
  - Implement cleanup job for expired archived versions
  - _Requirements: 4.7, 4.8_

- [ ] 25. Implement versioning API endpoints
  - Create GET /api/resumes/{resumeId}/versions endpoint
  - Create POST /api/resumes/{resumeId}/versions/{versionId}/restore endpoint
  - Add error handling for version not found and restoration failures
  - _Requirements: 4.4, 4.5_

- [ ]* 26. Write property tests for versioning
  - **Property 8: Version Snapshot Completeness** - Verify all resume data captured
  - **Property 9: Version Restoration Accuracy** - Verify restored data matches snapshot
  - **Property 10: Version History Ordering** - Verify reverse chronological order
  - Test with random resume updates and restoration sequences
  - _Requirements: 4.1, 4.4, 4.5_

- [ ]* 27. Write unit tests for versioning
  - Test automatic version creation on resume update
  - Test version snapshot data completeness
  - Test version restoration accuracy
  - Test version history ordering
  - Test version archival (50 version limit)
  - _Requirements: 4.1, 4.4, 4.7_

- [ ] 28. Checkpoint - Verify versioning works end-to-end
  - Create multiple resume versions
  - Verify version history is correct
  - Restore previous version and verify accuracy
  - Verify archival at 50 version limit

## Phase 5: Analytics Service

- [x] 29. Implement analytics service core
  - Create AnalyticsService class
  - Implement recordView method to capture view events
  - Extract device type, browser, OS from user agent
  - Extract geographic location from IP address
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 30. Implement analytics data retrieval and aggregation
  - Create getAnalytics method for dashboard data
  - Implement view count and unique viewer calculations
  - Add engagement metrics per section
  - Implement download-to-view and share-to-view ratio calculations
  - _Requirements: 6.4, 6.5, 6.7, 6.8_

- [ ] 31. Implement analytics aggregation for performance
  - Create aggregation job for records older than 30 days
  - Implement daily summary creation
  - Maintain hourly detail for last 30 days
  - Add automatic aggregation trigger when records exceed 10,000
  - _Requirements: 6.9_

- [ ] 32. Implement analytics API endpoints
  - Create GET /api/resumes/{resumeId}/analytics endpoint
  - Create GET /api/resumes/{resumeId}/analytics/viewers endpoint with pagination
  - Add filtering and sorting options
  - _Requirements: 6.4, 6.5_

- [ ] 33. Implement view recording trigger
  - Add async view recording to public resume view endpoint
  - Implement recordDownload method for export downloads
  - Add metadata capture for all view/download events
  - _Requirements: 6.1, 5.7_

- [ ]* 34. Write property tests for analytics
  - **Property 13: View Recording Accuracy** - Verify view records created with correct metadata
  - **Property 14: Analytics Metric Calculation** - Verify metrics calculated correctly
  - Test with random view sequences and metadata
  - _Requirements: 6.1, 6.4_

- [ ]* 35. Write unit tests for analytics
  - Test view recording with device metadata
  - Test analytics metric calculations
  - Test viewer list retrieval
  - Test analytics aggregation
  - Test download count tracking
  - _Requirements: 6.1, 6.4, 5.7_

- [ ] 36. Checkpoint - Verify analytics collection and reporting works
  - Generate multiple views with various metadata
  - Verify analytics dashboard displays correct metrics
  - Verify aggregation occurs at 10,000 records
  - Verify viewer list is accurate

## Phase 6: Notification Service

- [x] 37. Implement notification service core
  - Create NotificationService class
  - Implement createNotification method for view/download events
  - Store notification with viewer information and timestamp
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 38. Implement notification aggregation
  - Create aggregation logic for multiple views from same viewer
  - Implement aggregation window (configurable, default 1 hour)
  - Update aggregated notification count
  - _Requirements: 10.5_

- [ ] 39. Implement notification preferences
  - Create NotificationPreference model management
  - Implement updateNotificationPreferences method
  - Support view, download, and email notification toggles
  - _Requirements: 10.4, 10.7_

- [ ] 40. Implement email notification sending
  - Create email template for notifications
  - Implement sendNotificationEmail method
  - Add queue-based sending (non-blocking)
  - Include viewer information and analytics link
  - _Requirements: 10.4, 10.8_

- [ ] 41. Implement notification API endpoints
  - Create GET /api/notifications endpoint with pagination
  - Create PATCH /api/notifications/{notificationId}/read endpoint
  - Create PATCH /api/notifications/preferences endpoint
  - _Requirements: 10.6, 10.7_

- [ ] 42. Integrate notifications with view/download recording
  - Trigger notification creation on view recording
  - Trigger notification creation on download recording
  - Check notification preferences before sending emails
  - _Requirements: 10.1, 10.2, 10.4_

- [ ]* 43. Write property tests for notifications
  - **Property 18: Notification Creation on View** - Verify notifications created for views
  - **Property 19: Notification Aggregation** - Verify multiple views aggregated correctly
  - Test with random view sequences from same/different viewers
  - _Requirements: 10.1, 10.5_

- [ ]* 44. Write unit tests for notifications
  - Test notification creation on view/download
  - Test notification aggregation
  - Test notification preferences
  - Test email notification sending
  - _Requirements: 10.1, 10.5, 10.4_

- [ ] 45. Checkpoint - Verify notifications work end-to-end
  - Create views and verify notifications created
  - Verify aggregation works correctly
  - Verify email notifications sent
  - Verify notification preferences respected

## Phase 7: Share Link Management Dashboard

- [ ] 46. Implement share management dashboard API
  - Create endpoint to retrieve all share links for a resume
  - Include view count and last viewed timestamp
  - Add share summary statistics
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 47. Implement dashboard filtering and management
  - Add filtering by status (active, expired, revoked)
  - Implement copy-to-clipboard functionality
  - Add link extension and revocation from dashboard
  - _Requirements: 8.4, 8.5, 8.6, 8.7_

- [ ] 48. Implement dashboard summary statistics
  - Calculate total shares, active links, expired links
  - Display summary on dashboard
  - _Requirements: 8.8_

- [ ]* 49. Write unit tests for dashboard
  - Test share link retrieval
  - Test filtering by status
  - Test summary statistics calculation
  - _Requirements: 8.1, 8.7, 8.8_

- [ ] 50. Checkpoint - Verify dashboard displays correctly
  - Verify all share links displayed
  - Verify filtering works
  - Verify statistics accurate

## Phase 8: Integration and Wiring

- [ ] 51. Integrate PDF export with resume update flow
  - Add export recording to resume update endpoint
  - Ensure export history is maintained
  - _Requirements: 1.8, 5.1_

- [ ] 52. Integrate versioning with resume update flow
  - Add automatic version creation to resume update endpoint
  - Ensure version snapshot captures all data
  - _Requirements: 4.1, 4.2_

- [ ] 53. Integrate analytics with share link access
  - Add view recording to public resume view endpoint
  - Ensure analytics data is captured asynchronously
  - _Requirements: 6.1, 6.2_

- [ ] 54. Integrate notifications with view/download events
  - Add notification creation to view recording
  - Add notification creation to download recording
  - Ensure email notifications sent based on preferences
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 55. Integrate sharing with email service
  - Connect share link creation to email sending
  - Ensure emails sent to all recipients
  - _Requirements: 2.4, 2.5_

- [ ] 56. Add rate limiting to all endpoints
  - Implement rate limiting for export (10 per hour)
  - Implement rate limiting for share creation (50 per hour)
  - Implement rate limiting for analytics queries (100 per hour)
  - Implement rate limiting for view recording (1000 per hour per resume)
  - _Requirements: 1.7, 2.1_

- [ ]* 57. Write integration tests for full export flow
  - Create resume → export PDF → verify file → check history
  - Test with multiple templates
  - Test error handling
  - _Requirements: 1.1, 1.8, 5.1_

- [ ]* 58. Write integration tests for full sharing flow
  - Create share link → send email → access link → verify view recorded
  - Test expiration enforcement
  - Test revocation enforcement
  - _Requirements: 2.1, 2.4, 2.6, 6.1_

- [ ]* 59. Write integration tests for full versioning flow
  - Create resume → update → view history → restore version
  - Verify version accuracy
  - _Requirements: 4.1, 4.4, 4.5_

- [ ]* 60. Write integration tests for full analytics flow
  - Create shares → generate views → verify analytics dashboard
  - Test metric calculations
  - _Requirements: 6.1, 6.4_

- [ ]* 61. Write integration tests for full notification flow
  - Enable notifications → create views → verify emails sent
  - Test aggregation
  - _Requirements: 10.1, 10.4_

- [ ] 62. Checkpoint - Verify all integrations work end-to-end
  - Test complete user flows for all features
  - Verify data consistency across services
  - Verify error handling and edge cases

## Phase 9: Caching and Performance Optimization

- [ ] 63. Implement caching strategy
  - Add 1-hour cache for export history
  - Add 30-minute cache for analytics summaries
  - Add 5-minute cache for share link validation
  - Add 1-hour cache for version history
  - Implement cache invalidation on data changes
  - _Requirements: 5.3, 6.4_

- [ ] 64. Implement async processing for background tasks
  - Move export recording to async queue
  - Move analytics aggregation to scheduled job
  - Move notification email sending to queue
  - Move version archival to scheduled job
  - _Requirements: 5.1, 6.9, 10.4_

- [ ] 65. Implement cleanup jobs
  - Create job to clean up expired share links
  - Create job to archive old versions (90-day retention)
  - Create job to aggregate analytics (daily)
  - _Requirements: 4.8, 6.9_

- [ ]* 66. Write performance tests
  - Test PDF generation with large resumes (100+ sections)
  - Test analytics queries with 10,000+ records
  - Test version history retrieval with 50+ versions
  - Test share link validation under high concurrency
  - _Requirements: 7.4, 6.9_

- [ ] 67. Checkpoint - Verify performance meets requirements
  - Verify PDF generation completes within acceptable time
  - Verify analytics queries perform well
  - Verify caching is effective

## Phase 10: Error Handling and Validation

- [ ] 68. Implement comprehensive error handling
  - Add validation for PDF generation errors (invalid data, template not found)
  - Add validation for sharing errors (invalid email, too many recipients)
  - Add validation for versioning errors (version not found, restoration failed)
  - Add validation for analytics errors (invalid share token)
  - Add validation for notification errors (user not found, email service unavailable)
  - _Requirements: 1.7, 2.1, 4.5, 6.1, 10.1_

- [ ] 69. Implement error logging and monitoring
  - Add structured logging for all service operations
  - Add error tracking and alerting
  - Add performance monitoring
  - _Requirements: 1.7, 7.7_

- [ ]* 70. Write error handling tests
  - Test PDF generation error scenarios
  - Test sharing error scenarios
  - Test versioning error scenarios
  - Test analytics error scenarios
  - Test notification error scenarios
  - _Requirements: 1.7, 2.1, 4.5_

- [ ] 71. Checkpoint - Verify error handling is comprehensive
  - Test all error scenarios
  - Verify error messages are descriptive
  - Verify logging is working

## Phase 11: Final Testing and Deployment Preparation

- [ ] 72. Run full test suite
  - Execute all unit tests
  - Execute all property-based tests
  - Execute all integration tests
  - Verify code coverage meets requirements
  - _Requirements: All_

- [ ] 73. Perform manual testing of all features
  - Test PDF export with all templates
  - Test email sharing and link access
  - Test version history and restoration
  - Test analytics dashboard
  - Test notifications
  - _Requirements: All_

- [ ] 74. Verify database migrations and schema
  - Run migrations on test database
  - Verify all tables and indexes created
  - Verify data integrity constraints
  - _Requirements: 2.8, 3.2, 4.2, 5.1, 6.1_

- [ ] 75. Prepare deployment documentation
  - Document database migration steps
  - Document environment variables needed
  - Document service dependencies
  - Document rollback procedures
  - _Requirements: All_

- [ ] 76. Final checkpoint - All features complete and tested
  - Verify all requirements met
  - Verify all tests passing
  - Verify performance acceptable
  - Ready for deployment

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are recommended for production quality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- All code should follow existing project conventions and patterns
- Database migrations should be tested against both PostgreSQL and any other supported databases

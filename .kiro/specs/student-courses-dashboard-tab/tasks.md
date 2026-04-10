# Student Courses Dashboard Tab - Implementation Tasks

## Overview
This document outlines the implementation tasks for rebuilding the Student Courses Dashboard Tab with three sections: Discover, Assigned, and Learning Pathway. Tasks are organized by component and feature, with dependencies clearly marked.

## Task Execution Order

### Phase 1: API Endpoints (Foundation)
These tasks establish the backend endpoints required by all frontend components.

- [ ] 1.1 Create GET /api/dashboard/courses/discover endpoint
  - Fetch approved courses (approvalStatus = APPROVED)
  - Include pagination, filtering, and search
  - Return course metadata with instructor info
  - Include enrollment count for each course
  - Sub-tasks:
    - [ ] 1.1.1 Query approved courses from database
    - [ ] 1.1.2 Implement pagination (skip, take)
    - [ ] 1.1.3 Implement category filtering
    - [ ] 1.1.4 Implement search by title/description
    - [ ] 1.1.5 Implement sorting (recent, popular, rating)
    - [ ] 1.1.6 Exclude already-enrolled courses
    - [ ] 1.1.7 Add error handling and validation

- [ ] 1.2 Create GET /api/dashboard/courses/assigned endpoint
  - Fetch CourseAssignment records for current student
  - Include course metadata and assignment details
  - Filter out REVOKED assignments
  - Return admin information who made assignment
  - Sub-tasks:
    - [ ] 1.2.1 Query CourseAssignment records
    - [ ] 1.2.2 Join with Course and User tables
    - [ ] 1.2.3 Implement pagination
    - [ ] 1.2.4 Filter out REVOKED status
    - [ ] 1.2.5 Include admin assignment info
    - [ ] 1.2.6 Exclude already-enrolled courses
    - [ ] 1.2.7 Add error handling and validation

- [ ] 1.3 Create GET /api/dashboard/courses/enrolled endpoint
  - Fetch Enrollment records for current student with status ACTIVE
  - Include course metadata and progress information
  - Calculate progress percentage and lesson counts
  - Support pagination and sorting
  - Sub-tasks:
    - [ ] 1.3.1 Query Enrollment records with ACTIVE status
    - [ ] 1.3.2 Join with Course and Lesson tables
    - [ ] 1.3.3 Calculate progress percentage
    - [ ] 1.3.4 Count lessons and completed lessons
    - [ ] 1.3.5 Implement pagination
    - [ ] 1.3.6 Implement sorting (recent, progress, completion)
    - [ ] 1.3.7 Add error handling and validation

### Phase 2: Mutation Endpoints (Actions)
These tasks create endpoints for user actions on courses.

- [ ] 2.1 Create POST /api/dashboard/courses/enroll endpoint
  - Create Enrollment record for student
  - Set status to ACTIVE and progressPercentage to 0
  - Validate course exists and is approved
  - Return updated course data
  - Sub-tasks:
    - [ ] 2.1.1 Validate course exists and is approved
    - [ ] 2.1.2 Check student not already enrolled
    - [ ] 2.1.3 Create Enrollment record
    - [ ] 2.1.4 Initialize progress to 0%
    - [ ] 2.1.5 Return success response
    - [ ] 2.1.6 Add error handling

- [ ] 2.2 Create POST /api/dashboard/courses/assign/accept endpoint
  - Update CourseAssignment status to ACCEPTED
  - Create Enrollment record for the course
  - Return updated assignment and enrollment data
  - Sub-tasks:
    - [ ] 2.2.1 Validate assignment exists and belongs to student
    - [ ] 2.2.2 Update assignment status to ACCEPTED
    - [ ] 2.2.3 Create Enrollment record
    - [ ] 2.2.4 Return success response
    - [ ] 2.2.5 Add error handling

- [ ] 2.3 Create POST /api/dashboard/courses/assign/decline endpoint
  - Update CourseAssignment status to DECLINED
  - Do not create Enrollment record
  - Return success response
  - Sub-tasks:
    - [ ] 2.3.1 Validate assignment exists and belongs to student
    - [ ] 2.3.2 Update assignment status to DECLINED
    - [ ] 2.3.3 Return success response
    - [ ] 2.3.4 Add error handling

### Phase 3: UI Components (Frontend)
These tasks build the React components for the courses tab.

- [ ] 3.1 Create CourseCard component
  - Display course information in card layout
  - Show course image, title, description, level, category
  - Display instructor information
  - Include section-specific metadata
  - Render appropriate CTA button
  - Sub-tasks:
    - [ ] 3.1.1 Create card structure with image header
    - [ ] 3.1.2 Add course metadata display
    - [ ] 3.1.3 Add instructor information
    - [ ] 3.1.4 Implement section-specific rendering
    - [ ] 3.1.5 Add hover effects and animations
    - [ ] 3.1.6 Implement responsive sizing
    - [ ] 3.1.7 Add loading state skeleton

- [ ] 3.2 Create SearchBar component
  - Render search input with debouncing
  - Include category and level filter dropdowns
  - Add clear filters button
  - Handle filter state changes
  - Sub-tasks:
    - [ ] 3.2.1 Create search input with debounce
    - [ ] 3.2.2 Create category filter dropdown
    - [ ] 3.2.3 Create level filter dropdown
    - [ ] 3.2.4 Add clear filters button
    - [ ] 3.2.5 Implement filter state management
    - [ ] 3.2.6 Add responsive layout

- [ ] 3.3 Create SectionHeader component
  - Display section title and description
  - Show course count badge
  - Render consistent styling
  - Sub-tasks:
    - [ ] 3.3.1 Create header layout
    - [ ] 3.3.2 Add title and description
    - [ ] 3.3.3 Add course count badge
    - [ ] 3.3.4 Implement responsive styling

- [ ] 3.4 Create EmptyState component
  - Display contextual message based on section
  - Show illustration or icon
  - Include call-to-action when appropriate
  - Sub-tasks:
    - [ ] 3.4.1 Create empty state layout
    - [ ] 3.4.2 Add section-specific messaging
    - [ ] 3.4.3 Add illustration/icon
    - [ ] 3.4.4 Add CTA button when appropriate

- [ ] 3.5 Create Pagination component
  - Display previous/next buttons
  - Show current page and total pages
  - Handle page change callbacks
  - Sub-tasks:
    - [ ] 3.5.1 Create pagination controls
    - [ ] 3.5.2 Add page number display
    - [ ] 3.5.3 Implement disabled states
    - [ ] 3.5.4 Add loading state

- [ ] 3.6 Create DiscoverSection component
  - Render course grid with CourseCard components
  - Handle enroll button clicks
  - Manage loading and error states
  - Display empty state when no courses
  - Sub-tasks:
    - [ ] 3.6.1 Create section container
    - [ ] 3.6.2 Render course grid
    - [ ] 3.6.3 Implement enroll action
    - [ ] 3.6.4 Add loading state
    - [ ] 3.6.5 Add error state with retry
    - [ ] 3.6.6 Add empty state
    - [ ] 3.6.7 Add pagination

- [ ] 3.7 Create AssignedSection component
  - Render course grid with CourseCard components
  - Handle accept and decline button clicks
  - Show confirmation dialog for decline
  - Manage loading and error states
  - Sub-tasks:
    - [ ] 3.7.1 Create section container
    - [ ] 3.7.2 Render course grid
    - [ ] 3.7.3 Implement accept action
    - [ ] 3.7.4 Implement decline action with confirmation
    - [ ] 3.7.5 Add loading state
    - [ ] 3.7.6 Add error state with retry
    - [ ] 3.7.7 Add empty state
    - [ ] 3.7.8 Add pagination

- [ ] 3.8 Create LearningPathwaySection component
  - Render course grid with CourseCard components
  - Display progress information
  - Handle continue button clicks
  - Manage loading and error states
  - Sub-tasks:
    - [ ] 3.8.1 Create section container
    - [ ] 3.8.2 Render course grid
    - [ ] 3.8.3 Display progress percentage
    - [ ] 3.8.4 Implement continue action
    - [ ] 3.8.5 Add loading state
    - [ ] 3.8.6 Add error state with retry
    - [ ] 3.8.7 Add empty state
    - [ ] 3.8.8 Add pagination

- [ ] 3.9 Create CoursesTab main component
  - Orchestrate data fetching from three endpoints
  - Manage search and filter state
  - Handle pagination for each section
  - Coordinate section rendering
  - Sub-tasks:
    - [ ] 3.9.1 Create component structure
    - [ ] 3.9.2 Implement data fetching logic
    - [ ] 3.9.3 Implement search and filter logic
    - [ ] 3.9.4 Implement pagination management
    - [ ] 3.9.5 Add error handling and recovery
    - [ ] 3.9.6 Implement loading states
    - [ ] 3.9.7 Add responsive layout

### Phase 4: Integration and Routing
These tasks integrate the courses tab into the dashboard.

- [ ] 4.1 Create courses page route
  - Create /app/dashboard/courses/page.tsx
  - Render CoursesTab component
  - Add page metadata
  - Sub-tasks:
    - [ ] 4.1.1 Create page file
    - [ ] 4.1.2 Add session requirement
    - [ ] 4.1.3 Render CoursesTab
    - [ ] 4.1.4 Add page metadata

- [ ] 4.2 Update dashboard layout navigation
  - Ensure Courses link in sidebar points to /dashboard/courses
  - Verify link styling and active state
  - Sub-tasks:
    - [ ] 4.2.1 Verify sidebar link configuration
    - [ ] 4.2.2 Test active state highlighting
    - [ ] 4.2.3 Test navigation functionality

### Phase 5: Testing and Validation
These tasks ensure correctness and quality.

- [ ] 5.1 Write unit tests for CourseCard component
  - Test rendering with different props
  - Test section-specific rendering
  - Test button click handlers
  - Sub-tasks:
    - [ ] 5.1.1 Test discover card rendering
    - [ ] 5.1.2 Test assigned card rendering
    - [ ] 5.1.3 Test enrolled card rendering
    - [ ] 5.1.4 Test button click handlers

- [ ] 5.2 Write unit tests for SearchBar component
  - Test search input changes
  - Test filter dropdown changes
  - Test clear filters functionality
  - Sub-tasks:
    - [ ] 5.2.1 Test search input
    - [ ] 5.2.2 Test category filter
    - [ ] 5.2.3 Test level filter
    - [ ] 5.2.4 Test clear filters

- [ ] 5.3 Write integration tests for CoursesTab
  - Test data fetching from all three endpoints
  - Test search and filter functionality
  - Test pagination
  - Test user actions (enroll, accept, decline)
  - Sub-tasks:
    - [ ] 5.3.1 Test discover section data loading
    - [ ] 5.3.2 Test assigned section data loading
    - [ ] 5.3.3 Test enrolled section data loading
    - [ ] 5.3.4 Test search functionality
    - [ ] 5.3.5 Test filter functionality
    - [ ] 5.3.6 Test pagination
    - [ ] 5.3.7 Test enroll action
    - [ ] 5.3.8 Test accept action
    - [ ] 5.3.9 Test decline action

- [ ] 5.4 Write property-based tests for correctness properties
  - Test enrolled courses excluded from discover
  - Test enrolled courses excluded from assigned
  - Test assigned courses filter excludes revoked
  - Test enrollment count accuracy
  - Test progress percentage accuracy
  - Test search filters combine with AND logic
  - Test filter state preservation
  - Test pagination state consistency
  - Test assignment status reflects database
  - Test enrollment creation on accept
  - Sub-tasks:
    - [ ] 5.4.1 Test Property 1: Enrolled courses excluded from discover
    - [ ] 5.4.2 Test Property 2: Enrolled courses excluded from assigned
    - [ ] 5.4.3 Test Property 3: Assigned courses filter excludes revoked
    - [ ] 5.4.4 Test Property 4: Enrollment count accuracy
    - [ ] 5.4.5 Test Property 5: Progress percentage accuracy
    - [ ] 5.4.6 Test Property 6: Search filters combine with AND logic
    - [ ] 5.4.7 Test Property 7: Filter state preservation
    - [ ] 5.4.8 Test Property 8: Pagination state consistency
    - [ ] 5.4.9 Test Property 9: Assignment status reflects database
    - [ ] 5.4.10 Test Property 10: Enrollment creation on accept

- [ ] 5.5 Write E2E tests for critical user flows
  - Test discover → enroll → learning pathway flow
  - Test assigned → accept → learning pathway flow
  - Test search and filter functionality
  - Test error recovery and retry
  - Sub-tasks:
    - [ ] 5.5.1 Test discover and enroll flow
    - [ ] 5.5.2 Test assigned and accept flow
    - [ ] 5.5.3 Test search and filter flow
    - [ ] 5.5.4 Test error recovery flow

### Phase 6: Documentation and Deployment
These tasks finalize the feature.

- [ ] 6.1 Update API documentation
  - Document three new endpoints
  - Include request/response examples
  - Document error responses
  - Sub-tasks:
    - [ ] 6.1.1 Document GET /api/dashboard/courses/discover
    - [ ] 6.1.2 Document GET /api/dashboard/courses/assigned
    - [ ] 6.1.3 Document GET /api/dashboard/courses/enrolled
    - [ ] 6.1.4 Document POST /api/dashboard/courses/enroll
    - [ ] 6.1.5 Document POST /api/dashboard/courses/assign/accept
    - [ ] 6.1.6 Document POST /api/dashboard/courses/assign/decline

- [ ] 6.2 Update component documentation
  - Document CoursesTab component
  - Document CourseCard component
  - Document SearchBar component
  - Sub-tasks:
    - [ ] 6.2.1 Document CoursesTab props and usage
    - [ ] 6.2.2 Document CourseCard props and usage
    - [ ] 6.2.3 Document SearchBar props and usage

- [ ] 6.3 Verify responsive design
  - Test on mobile devices
  - Test on tablet devices
  - Test on desktop devices
  - Sub-tasks:
    - [ ] 6.3.1 Test mobile layout (< 640px)
    - [ ] 6.3.2 Test tablet layout (640px - 1024px)
    - [ ] 6.3.3 Test desktop layout (> 1024px)

- [ ] 6.4 Performance optimization
  - Optimize image loading
  - Implement lazy loading for pagination
  - Optimize API calls
  - Sub-tasks:
    - [ ] 6.4.1 Optimize course card images
    - [ ] 6.4.2 Implement lazy loading
    - [ ] 6.4.3 Optimize API call batching

- [ ] 6.5 Accessibility review
  - Ensure keyboard navigation
  - Verify screen reader compatibility
  - Check color contrast
  - Sub-tasks:
    - [ ] 6.5.1 Test keyboard navigation
    - [ ] 6.5.2 Test screen reader compatibility
    - [ ] 6.5.3 Verify color contrast ratios

- [ ] 6.6 Final QA and deployment
  - Conduct full QA testing
  - Verify all features working
  - Deploy to production
  - Sub-tasks:
    - [ ] 6.6.1 Full QA testing
    - [ ] 6.6.2 Verify all features
    - [ ] 6.6.3 Deploy to production
    - [ ] 6.6.4 Monitor for issues

## Dependencies

- Phase 1 (API Endpoints) must complete before Phase 3 (UI Components)
- Phase 3 (UI Components) must complete before Phase 4 (Integration)
- Phase 4 (Integration) must complete before Phase 5 (Testing)
- Phase 5 (Testing) should run in parallel with Phase 6 (Documentation)

## Success Criteria

- All API endpoints return correct data structures
- All UI components render correctly on all device sizes
- All user actions (enroll, accept, decline) work correctly
- All correctness properties pass validation
- All tests pass with >90% code coverage
- Feature is responsive and accessible
- Performance metrics meet targets
- Documentation is complete and accurate

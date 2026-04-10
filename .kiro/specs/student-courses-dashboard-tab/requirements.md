# Student Courses Dashboard Tab Requirements

## Introduction

The Student Courses Dashboard Tab rebuilds the courses section of the student dashboard with a three-section layout that provides clear organization of course discovery, assignment, and learning progress. This feature enables students to discover admin-approved courses, view courses assigned by administrators, and track their enrolled courses in a clean, professional interface with filtering and search capabilities. The implementation integrates with existing course approval workflows and enrollment systems.

## Glossary

- **Course**: A structured learning program containing lessons, assignments, and assessments
- **Approved Course**: A course created by a tutor and approved by an admin, or created directly by an admin
- **Assigned Course**: A course that an admin has explicitly assigned to a specific student
- **Enrolled Course**: A course that a student has accepted and is actively learning
- **Course Metadata**: Descriptive information about a course including title, description, level, category, and instructor
- **Discover Section**: The tab section displaying all admin-approved courses available for discovery
- **Assigned Section**: The tab section displaying courses assigned to the student by admin
- **Learning Pathway Section**: The tab section displaying courses the student has enrolled in
- **Course Level**: The difficulty level of a course (Beginner, Intermediate, Advanced)
- **Course Category**: The subject classification of a course (e.g., Technology, Business, Design)
- **Instructor**: The tutor or admin who created the course
- **Enrollment**: The relationship between a student and a course, tracking progress and status
- **Course Assignment**: An admin action to assign a specific course to a specific student
- **Approval Status**: The administrative status of a course (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)

## Requirements

### Requirement 1: Discover Section - Display Approved Courses

**User Story:** As a student, I want to see all admin-approved courses in a dedicated Discover section, so that I can explore available learning opportunities.

#### Acceptance Criteria

1. WHEN the student navigates to the Courses tab, THE Dashboard SHALL display a Discover section containing all courses with approvalStatus of APPROVED
2. WHEN the Discover section loads, THE Dashboard SHALL include courses created by tutors (approvalStatus = APPROVED) and courses created by admins (approvalStatus = APPROVED)
3. WHEN the Discover section displays courses, THE Dashboard SHALL show course metadata including title, description, level, category, and instructor name
4. WHEN the Discover section displays courses, THE Dashboard SHALL show enrollment count for each course
5. WHEN the Discover section displays courses, THE Dashboard SHALL show course rating or quality indicator if available
6. WHEN the Discover section loads, THE Dashboard SHALL fetch courses from the approved courses endpoint with pagination support
7. WHEN the Discover section is empty, THE Dashboard SHALL display a message indicating no approved courses are available
8. WHEN a course is displayed in Discover, THE Dashboard SHALL NOT show courses the student is already enrolled in

### Requirement 2: Assigned Section - Display Admin-Assigned Courses

**User Story:** As a student, I want to see courses assigned to me by administrators in a dedicated Assigned section, so that I can understand my required learning path.

#### Acceptance Criteria

1. WHEN the student navigates to the Courses tab, THE Dashboard SHALL display an Assigned section containing courses assigned to the student
2. WHEN the Assigned section loads, THE Dashboard SHALL fetch courses from the CourseAssignment table where studentId matches the current user and status is PENDING or ACCEPTED
3. WHEN the Assigned section displays courses, THE Dashboard SHALL show course metadata including title, description, level, category, and instructor name
4. WHEN the Assigned section displays courses, THE Dashboard SHALL show assignment status (PENDING, ACCEPTED, DECLINED, REVOKED)
5. WHEN the Assigned section displays courses, THE Dashboard SHALL show the date the course was assigned
6. WHEN the Assigned section displays courses, THE Dashboard SHALL show assignment notes if provided by the admin
7. WHEN the Assigned section is empty, THE Dashboard SHALL display a message indicating no courses have been assigned
8. WHEN a course is displayed in Assigned, THE Dashboard SHALL NOT show courses the student is already enrolled in

### Requirement 3: Learning Pathway Section - Display Enrolled Courses

**User Story:** As a student, I want to see all courses I'm enrolled in within a Learning Pathway section, so that I can track my active learning progress.

#### Acceptance Criteria

1. WHEN the student navigates to the Courses tab, THE Dashboard SHALL display a Learning Pathway section containing courses the student is enrolled in
2. WHEN the Learning Pathway section loads, THE Dashboard SHALL fetch courses from the Enrollment table where userId matches the current user and status is ACTIVE
3. WHEN the Learning Pathway section displays courses, THE Dashboard SHALL show course metadata including title, description, level, category, and instructor name
4. WHEN the Learning Pathway section displays courses, THE Dashboard SHALL show enrollment progress percentage for each course
5. WHEN the Learning Pathway section displays courses, THE Dashboard SHALL show the date the student enrolled in the course
6. WHEN the Learning Pathway section displays courses, THE Dashboard SHALL show completion status if the course is completed
7. WHEN the Learning Pathway section is empty, THE Dashboard SHALL display a message indicating the student has not enrolled in any courses
8. WHEN a course is displayed in Learning Pathway, THE Dashboard SHALL show a link or button to continue learning

### Requirement 4: Fetch Approved Courses Endpoint

**User Story:** As a developer, I want a dedicated endpoint to fetch admin-approved courses, so that the Discover section can display available courses efficiently.

#### Acceptance Criteria

1. WHEN the Dashboard requests approved courses, THE API SHALL return courses with approvalStatus = APPROVED
2. WHEN the API returns approved courses, THE API SHALL include course metadata (id, title, description, level, category, coverImage)
3. WHEN the API returns approved courses, THE API SHALL include instructor information (id, firstName, lastName, email)
4. WHEN the API returns approved courses, THE API SHALL include enrollment count for each course
5. WHEN the API returns approved courses, THE API SHALL support pagination with skip and take parameters
6. WHEN the API returns approved courses, THE API SHALL support filtering by category
7. WHEN the API returns approved courses, THE API SHALL support search by title or description
8. WHEN the API returns approved courses, THE API SHALL support sorting by recent, popular, or rating
9. WHEN the API request fails, THE API SHALL return a descriptive error message with appropriate HTTP status code

### Requirement 5: Fetch Assigned Courses Endpoint

**User Story:** As a developer, I want a dedicated endpoint to fetch courses assigned to a specific student, so that the Assigned section can display personalized course assignments.

#### Acceptance Criteria

1. WHEN the Dashboard requests assigned courses for a student, THE API SHALL return CourseAssignment records where studentId matches the current user
2. WHEN the API returns assigned courses, THE API SHALL include course metadata (id, title, description, level, category, coverImage)
3. WHEN the API returns assigned courses, THE API SHALL include instructor information (id, firstName, lastName, email)
4. WHEN the API returns assigned courses, THE API SHALL include assignment metadata (assignedAt, status, notes)
5. WHEN the API returns assigned courses, THE API SHALL include admin information who made the assignment (firstName, lastName)
6. WHEN the API returns assigned courses, THE API SHALL support pagination with skip and take parameters
7. WHEN the API returns assigned courses, THE API SHALL filter out assignments with status REVOKED
8. WHEN the API request fails, THE API SHALL return a descriptive error message with appropriate HTTP status code

### Requirement 6: Fetch Enrolled Courses Endpoint

**User Story:** As a developer, I want a dedicated endpoint to fetch courses a student is enrolled in, so that the Learning Pathway section can display active learning progress.

#### Acceptance Criteria

1. WHEN the Dashboard requests enrolled courses for a student, THE API SHALL return Enrollment records where userId matches the current user and status is ACTIVE
2. WHEN the API returns enrolled courses, THE API SHALL include course metadata (id, title, description, level, category, coverImage)
3. WHEN the API returns enrolled courses, THE API SHALL include instructor information (id, firstName, lastName, email)
4. WHEN the API returns enrolled courses, THE API SHALL include enrollment metadata (progressPercentage, enrolledAt, completedAt)
5. WHEN the API returns enrolled courses, THE API SHALL support pagination with skip and take parameters
6. WHEN the API returns enrolled courses, THE API SHALL support sorting by recent, progress, or completion status
7. WHEN the API returns enrolled courses, THE API SHALL include lesson count for each course
8. WHEN the API request fails, THE API SHALL return a descriptive error message with appropriate HTTP status code

### Requirement 7: Course Card Component with Metadata Display

**User Story:** As a student, I want to see course information in a clean, professional card layout, so that I can quickly understand course details and make enrollment decisions.

#### Acceptance Criteria

1. WHEN a course is displayed, THE Component SHALL render a card showing course title, description, level, and category
2. WHEN a course card is displayed, THE Component SHALL show the instructor name and profile information
3. WHEN a course card is displayed, THE Component SHALL show enrollment count or progress percentage depending on the section
4. WHEN a course card is displayed, THE Component SHALL use consistent styling aligned with the current app theme
5. WHEN a course card is displayed, THE Component SHALL include a call-to-action button (Enroll, View, Continue, etc.) appropriate to the section
6. WHEN a course card is hovered, THE Component SHALL display visual feedback (scale, shadow, color change)
7. WHEN a course card is clicked, THE Component SHALL navigate to the course detail page or perform the appropriate action
8. WHEN a course card displays long text, THE Component SHALL truncate text appropriately with ellipsis

### Requirement 8: Search and Filter Functionality

**User Story:** As a student, I want to search and filter courses by category, level, and keywords, so that I can find relevant courses quickly.

#### Acceptance Criteria

1. WHEN the student uses the search input, THE Dashboard SHALL filter courses by title or description in real-time
2. WHEN the student selects a category filter, THE Dashboard SHALL display only courses matching the selected category
3. WHEN the student selects a level filter, THE Dashboard SHALL display only courses matching the selected level (Beginner, Intermediate, Advanced)
4. WHEN the student applies multiple filters, THE Dashboard SHALL combine filters with AND logic
5. WHEN the student clears filters, THE Dashboard SHALL reset to showing all courses
6. WHEN search or filter results are empty, THE Dashboard SHALL display a message indicating no courses match the criteria
7. WHEN the student searches or filters, THE Dashboard SHALL maintain pagination state appropriately
8. WHEN the student navigates between sections, THE Dashboard SHALL preserve search and filter state within each section

### Requirement 9: Loading and Error States

**User Story:** As a student, I want to see appropriate loading and error states, so that I understand the status of course data loading.

#### Acceptance Criteria

1. WHEN the Dashboard is loading course data, THE Component SHALL display a skeleton loader or loading indicator
2. WHEN the Dashboard is loading course data, THE Component SHALL show loading state for each section independently
3. WHEN a course data fetch fails, THE Component SHALL display an error message with a retry button
4. WHEN a course data fetch fails, THE Component SHALL log the error for debugging purposes
5. WHEN the Dashboard recovers from an error, THE Component SHALL automatically retry fetching data
6. WHEN the Dashboard displays an error, THE Component SHALL not block other sections from loading
7. WHEN the Dashboard is loading, THE Component SHALL show appropriate loading duration expectations
8. WHEN the Dashboard completes loading, THE Component SHALL animate the content into view

### Requirement 10: Responsive Layout and Professional Design

**User Story:** As a student, I want the courses dashboard to be responsive and professionally designed, so that I can use it on any device with a consistent experience.

#### Acceptance Criteria

1. WHEN the Dashboard is viewed on mobile devices, THE Layout SHALL stack sections vertically
2. WHEN the Dashboard is viewed on tablet devices, THE Layout SHALL display 2 columns of course cards
3. WHEN the Dashboard is viewed on desktop devices, THE Layout SHALL display 3 columns of course cards
4. WHEN the Dashboard is displayed, THE Layout SHALL use consistent spacing and padding aligned with the app theme
5. WHEN the Dashboard is displayed, THE Layout SHALL use professional typography and color scheme
6. WHEN the Dashboard is displayed, THE Layout SHALL include section headers with clear titles and descriptions
7. WHEN the Dashboard is displayed, THE Layout SHALL maintain visual hierarchy between sections
8. WHEN the Dashboard is displayed, THE Layout SHALL include appropriate whitespace for readability

### Requirement 11: Enrollment Action from Discover Section

**User Story:** As a student, I want to enroll in courses from the Discover section, so that I can add courses to my Learning Pathway.

#### Acceptance Criteria

1. WHEN a student clicks the Enroll button on a Discover course, THE Dashboard SHALL create an Enrollment record
2. WHEN enrollment is successful, THE Dashboard SHALL move the course from Discover to Learning Pathway
3. WHEN enrollment is successful, THE Dashboard SHALL show a success notification
4. WHEN enrollment fails, THE Dashboard SHALL display an error message with retry option
5. WHEN a student enrolls in a course, THE Dashboard SHALL update the enrollment count for that course
6. WHEN a student enrolls in a course, THE Dashboard SHALL set the enrollment status to ACTIVE
7. WHEN a student enrolls in a course, THE Dashboard SHALL initialize progress to 0%
8. WHEN enrollment is in progress, THE Dashboard SHALL disable the Enroll button and show loading state

### Requirement 12: Accept/Decline Action from Assigned Section

**User Story:** As a student, I want to accept or decline assigned courses, so that I can control which assigned courses I want to learn.

#### Acceptance Criteria

1. WHEN a student clicks Accept on an Assigned course, THE Dashboard SHALL update the CourseAssignment status to ACCEPTED
2. WHEN a student accepts an assignment, THE Dashboard SHALL create an Enrollment record for the course
3. WHEN a student accepts an assignment, THE Dashboard SHALL move the course from Assigned to Learning Pathway
4. WHEN a student accepts an assignment, THE Dashboard SHALL show a success notification
5. WHEN a student clicks Decline on an Assigned course, THE Dashboard SHALL update the CourseAssignment status to DECLINED
6. WHEN a student declines an assignment, THE Dashboard SHALL remove the course from the Assigned section
7. WHEN a student declines an assignment, THE Dashboard SHALL show a confirmation dialog before proceeding
8. WHEN an action fails, THE Dashboard SHALL display an error message with retry option


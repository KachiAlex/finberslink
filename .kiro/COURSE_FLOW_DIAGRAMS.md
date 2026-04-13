# Course Flow - Visual Diagrams

## Complete Course Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     COURSE FLOW LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────────────┘

                              ADMIN ACTIONS
                              ─────────────

                    ┌──────────────────────────┐
                    │  1. CREATE COURSE        │
                    │  POST /api/admin/courses │
                    │  Status: DRAFT           │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  2. APPROVE COURSE       │
                    │  PATCH /api/.../approve  │
                    │  Status: APPROVED        │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  3. ASSIGN TO STUDENT    │
                    │  POST /api/.../assign    │
                    │  Status: PENDING         │
                    └────────────┬─────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
        ┌──────────────────┐          ┌──────────────────┐
        │ DISCOVER SECTION │          │ ASSIGNED SECTION │
        │ (Approved)       │          │ (Assigned)       │
        └────────┬─────────┘          └────────┬─────────┘
                 │                             │
                 │ Student enrolls             │ Student accepts
                 │                             │
                 └────────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ LEARNING PATHWAY SECTION │
                    │ (Enrolled)               │
                    │ Status: ACTIVE           │
                    │ Progress: 0%             │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ Student completes       │
                    │ lessons                 │
                    │ Progress: 0% → 100%     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ COURSE COMPLETED         │
                    │ Status: COMPLETED        │
                    │ Progress: 100%           │
                    │ Completion Date: Set     │
                    └──────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────┘

ADMIN CREATES COURSE
    │
    ├─ Input: Course metadata
    │  ├─ title: "Web Development Fundamentals"
    │  ├─ description: "Learn web dev basics"
    │  ├─ level: "BEGINNER"
    │  ├─ category: "Web Development"
    │  └─ instructorId: "instructor-001"
    │
    └─ Output: Course record
       ├─ id: "course-001"
       ├─ approvalStatus: "DRAFT"
       ├─ createdAt: timestamp
       └─ archivedAt: null

ADMIN APPROVES COURSE
    │
    ├─ Input: courseId
    │
    └─ Output: Course record
       └─ approvalStatus: "APPROVED"

ADMIN ASSIGNS COURSE
    │
    ├─ Input: courseId, studentId
    │
    └─ Output: CourseAssignment record
       ├─ id: "assignment-001"
       ├─ courseId: "course-001"
       ├─ studentId: "student-001"
       ├─ status: "PENDING"
       ├─ assignedAt: timestamp
       └─ assignedBy: "admin-001"

STUDENT VIEWS DISCOVER
    │
    ├─ Query: Courses where approvalStatus = APPROVED
    │         AND enrollments.none { userId = student }
    │
    └─ Output: Course list
       ├─ id, title, description
       ├─ level, category, coverImage
       ├─ instructor info
       ├─ enrollmentCount
       └─ rating

STUDENT ENROLLS
    │
    ├─ Input: courseId
    │
    └─ Output: Enrollment record
       ├─ id: "enrollment-001"
       ├─ userId: "student-001"
       ├─ courseId: "course-001"
       ├─ status: "ACTIVE"
       ├─ progressPercentage: 0
       └─ enrolledAt: timestamp

STUDENT VIEWS LEARNING PATHWAY
    │
    ├─ Query: Enrollments where userId = student
    │         AND status = ACTIVE
    │
    └─ Output: Course list with progress
       ├─ id, title, description
       ├─ level, category, coverImage
       ├─ instructor info
       ├─ progressPercentage
       ├─ lessonsCount, lessonsCompleted
       └─ enrolledAt, completedAt

STUDENT COMPLETES LESSONS
    │
    ├─ Update: progressPercentage
    │  ├─ 0% → 20% → 40% → 60% → 80% → 100%
    │
    └─ Output: Updated Enrollment
       ├─ progressPercentage: 100
       └─ completedAt: timestamp
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                               │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User       │
├──────────────┤
│ id (PK)      │
│ firstName    │
│ lastName     │
│ email        │
│ role         │
│ status       │
└──────┬───────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│   Course     │                    │ Enrollment   │
├──────────────┤                    ├──────────────┤
│ id (PK)      │◄───────────────────│ courseId (FK)│
│ title        │                    │ userId (FK)  │
│ description  │                    │ status       │
│ level        │                    │ progress     │
│ category     │                    │ enrolledAt   │
│ instructorId │                    │ completedAt  │
│ approvalStatus                    └──────────────┘
│ createdAt    │
│ archivedAt   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ CourseAssign │
├──────────────┤
│ courseId (FK)│
│ studentId(FK)│
│ status       │
│ assignedAt   │
│ assignedBy   │
└──────────────┘
```

## API Call Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      API CALL SEQUENCE                                  │
└─────────────────────────────────────────────────────────────────────────┘

ADMIN
  │
  ├─ POST /api/admin/courses
  │  └─ Create course (DRAFT)
  │
  ├─ PATCH /api/admin/courses/:id/approve
  │  └─ Approve course (APPROVED)
  │
  └─ POST /api/admin/courses/:id/assign
     └─ Assign to student (PENDING)

STUDENT
  │
  ├─ GET /api/dashboard/courses/discover
  │  └─ View approved courses
  │
  ├─ POST /api/dashboard/courses/enroll
  │  └─ Enroll in course (ACTIVE, 0%)
  │
  ├─ GET /api/dashboard/courses/enrolled
  │  └─ View learning pathway
  │
  └─ [Lesson completion updates]
     └─ Progress: 0% → 100%
```

## State Transitions

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STATE TRANSITIONS                                    │
└─────────────────────────────────────────────────────────────────────────┘

COURSE STATES
─────────────

    ┌─────────┐
    │  DRAFT  │ (Created by admin)
    └────┬────┘
         │ Admin approves
         ▼
    ┌─────────────┐
    │  APPROVED   │ (Visible to students)
    └─────────────┘
         │
         ├─ Student enrolls
         │
         └─ Admin assigns
            │
            ▼
         ┌─────────────┐
         │  ASSIGNED   │ (In Assigned section)
         └─────────────┘


ENROLLMENT STATES
─────────────────

    ┌─────────┐
    │ ACTIVE  │ (Student enrolled, 0% progress)
    └────┬────┘
         │ Student completes lessons
         │ Progress: 0% → 100%
         │
         ▼
    ┌─────────────┐
    │ COMPLETED   │ (100% progress, completion date set)
    └─────────────┘


ASSIGNMENT STATES
─────────────────

    ┌─────────┐
    │ PENDING │ (Assigned, awaiting student action)
    └────┬────┘
         │
         ├─ Student accepts
         │  ▼
         │ ┌─────────┐
         │ │ACCEPTED │ (Enrollment created)
         │ └─────────┘
         │
         └─ Student declines
            ▼
         ┌─────────┐
         │DECLINED │ (Not enrolled)
         └─────────┘
```

## Filtering Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FILTERING LOGIC                                      │
└─────────────────────────────────────────────────────────────────────────┘

DISCOVER SECTION FILTER
───────────────────────

    All Courses
         │
         ├─ Filter: approvalStatus = APPROVED
         │
         ├─ Filter: enrollments.none { userId = student }
         │
         ├─ Filter: archivedAt = null
         │
         └─ Result: Approved courses not enrolled


ASSIGNED SECTION FILTER
───────────────────────

    All CourseAssignments
         │
         ├─ Filter: studentId = current_student
         │
         ├─ Filter: status IN [PENDING, ACCEPTED]
         │
         ├─ Filter: status != REVOKED
         │
         └─ Result: Assigned courses not revoked


LEARNING PATHWAY FILTER
───────────────────────

    All Enrollments
         │
         ├─ Filter: userId = current_student
         │
         ├─ Filter: status = ACTIVE
         │
         └─ Result: Active enrolled courses


SEARCH & FILTER COMBINATION (AND LOGIC)
───────────────────────────────────────

    Courses
         │
         ├─ Filter: title CONTAINS search_query
         │           OR description CONTAINS search_query
         │
         ├─ AND category = selected_category
         │
         ├─ AND level = selected_level
         │
         └─ Result: Courses matching ALL criteria
```

## Progress Calculation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROGRESS CALCULATION                                 │
└─────────────────────────────────────────────────────────────────────────┘

FORMULA
───────

    Progress % = (Lessons Completed / Total Lessons) × 100


EXAMPLE
───────

    Course: "Web Development Fundamentals"
    Total Lessons: 10
    
    ┌─────────────────────────────────────────┐
    │ Lesson 1: HTML Basics        [✓]  10%   │
    │ Lesson 2: CSS Fundamentals   [✓]  20%   │
    │ Lesson 3: JavaScript Basics  [✓]  30%   │
    │ Lesson 4: DOM Manipulation   [✓]  40%   │
    │ Lesson 5: Events             [✓]  50%   │
    │ Lesson 6: Forms              [✓]  60%   │
    │ Lesson 7: Validation         [✓]  70%   │
    │ Lesson 8: APIs               [✓]  80%   │
    │ Lesson 9: Async/Await        [✓]  90%   │
    │ Lesson 10: Project           [✓] 100%   │
    └─────────────────────────────────────────┘
    
    Calculation: (10 / 10) × 100 = 100%


PROGRESS STAGES
───────────────

    0%   ├─ Not started
    25%  ├─ 1/4 complete
    50%  ├─ 1/2 complete
    75%  ├─ 3/4 complete
    100% └─ Complete
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

ENROLLMENT ERRORS
─────────────────

    Student tries to enroll
         │
         ├─ Course not found?
         │  └─ Error: "Course not found" (404)
         │
         ├─ Course not approved?
         │  └─ Error: "Course is not approved" (400)
         │
         ├─ Course archived?
         │  └─ Error: "Course is archived" (400)
         │
         ├─ Already enrolled?
         │  └─ Error: "Already enrolled in this course" (400)
         │
         └─ Success
            └─ Enrollment created (200)


API ERRORS
──────────

    API request
         │
         ├─ 400 Bad Request
         │  └─ Invalid parameters
         │
         ├─ 401 Unauthorized
         │  └─ Not authenticated
         │
         ├─ 403 Forbidden
         │  └─ Not authorized
         │
         ├─ 404 Not Found
         │  └─ Resource not found
         │
         ├─ 500 Server Error
         │  └─ Internal server error
         │
         └─ Success (200, 201)
            └─ Operation completed
```

## Test Coverage Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TEST COVERAGE MAP                                    │
└─────────────────────────────────────────────────────────────────────────┘

COURSE FLOW TEST
────────────────

    ✅ Step 1: Create Course
    ✅ Step 2: Approve Course
    ✅ Step 3: Assign to Student
    ✅ Step 4: View Discover
    ✅ Step 5: Enroll
    ✅ Step 6: View Learning Pathway
    ✅ Step 7: Track Progress
    ✅ Integration: Complete Flow


CORRECTNESS PROPERTIES TEST
───────────────────────────

    ✅ Property 1: Enrolled excluded from discover
    ✅ Property 2: Enrolled excluded from assigned
    ✅ Property 3: Revoked excluded from assigned
    ✅ Property 4: Enrollment count accuracy
    ✅ Property 5: Progress percentage accuracy
    ✅ Property 6: Search filters AND logic
    ✅ Property 7: Filter state preservation
    ✅ Property 8: Pagination consistency
    ✅ Property 9: Assignment status reflects DB
    ✅ Property 10: Enrollment on accept


PRACTICAL TEST
──────────────

    ✅ Test 1: Create Course
    ✅ Test 2: Approve Course
    ✅ Test 3: Assign Course
    ✅ Test 4: View Discover
    ✅ Test 5: Enroll
    ✅ Test 6: View Learning Pathway
    ✅ Test 7: Progress Updates
    ✅ Test 8: Completion Tracking
    ✅ Error: Duplicate Enrollment
    ✅ Error: Unapproved Course
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE CONSIDERATIONS                           │
└─────────────────────────────────────────────────────────────────────────┘

QUERY OPTIMIZATION
──────────────────

    Discover Query
    ├─ Index: approvalStatus
    ├─ Index: enrollments.userId
    ├─ Select: Only needed fields
    └─ Pagination: 12 items/page

    Learning Pathway Query
    ├─ Index: userId, status
    ├─ Select: Only needed fields
    └─ Pagination: 12 items/page


CACHING STRATEGY
────────────────

    Approved Courses
    ├─ Cache: 5 minutes
    ├─ Invalidate: On course approval
    └─ Strategy: SWR or React Query

    Student Enrollments
    ├─ Cache: 2 minutes
    ├─ Invalidate: On enrollment change
    └─ Strategy: SWR or React Query


PAGINATION
──────────

    Default: 12 items/page
    Maximum: 100 items/page
    Strategy: Cursor-based or offset-based
    Scroll: Infinite scroll or pagination buttons
```

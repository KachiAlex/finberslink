# Course Flow Testing Guide

## Overview

This guide explains how to test the complete course flow from creation to student viewing. The test suite validates the entire lifecycle of a course in the Finbers platform.

## Test Files

### 1. `__tests__/e2e/course-flow.test.ts`
**Purpose**: End-to-end test of the complete course lifecycle

**What it tests**:
- Step 1: Admin creates a course (DRAFT status)
- Step 2: Admin approves the course (APPROVED status)
- Step 3: Admin assigns the course to a student
- Step 4: Student views course in Discover section
- Step 5: Student enrolls in the course
- Step 6: Student views course in Learning Pathway section
- Step 7: Student can see progress and course details

**Key validations**:
- Course creation with correct metadata
- Course approval workflow
- Course assignment system
- Discover section displays approved courses
- Enrollment prevents duplicates and unapproved courses
- Learning pathway shows enrolled courses
- Progress tracking works correctly

### 2. `__tests__/e2e/course-flow-integration.test.ts`
**Purpose**: Integration tests validating correctness properties

**What it tests**:
- Property 1: Enrolled courses excluded from discover
- Property 2: Enrolled courses excluded from assigned
- Property 3: Assigned courses filter excludes revoked
- Property 4: Enrollment count accuracy
- Property 5: Progress percentage accuracy
- Property 6: Search filters combine with AND logic
- Property 7: Filter state preservation
- Property 8: Pagination state consistency
- Property 9: Assignment status reflects database
- Property 10: Enrollment creation on accept

**Key validations**:
- Data consistency across sections
- Correct filtering logic
- Accurate calculations
- State management
- Database synchronization

## Running the Tests

### Run all course flow tests
```bash
npm test -- __tests__/e2e/course-flow.test.ts
npm test -- __tests__/e2e/course-flow-integration.test.ts
```

### Run specific test suite
```bash
npm test -- __tests__/e2e/course-flow.test.ts -t "Step 1"
npm test -- __tests__/e2e/course-flow-integration.test.ts -t "Property 1"
```

### Run with coverage
```bash
npm test -- __tests__/e2e/course-flow.test.ts --coverage
```

### Run in watch mode
```bash
npm test -- __tests__/e2e/course-flow.test.ts --watch
```

## Test Scenarios

### Scenario 1: Happy Path - Complete Course Flow
1. Admin creates course with title "Web Development Fundamentals"
2. Admin approves the course
3. Admin assigns course to student
4. Student navigates to Courses tab
5. Student sees course in Discover section
6. Student clicks Enroll button
7. Course moves to Learning Pathway section
8. Student can see 0% progress initially
9. As student completes lessons, progress updates
10. When all lessons complete, course shows 100% progress

**Expected Results**:
- ✅ Course appears in Discover with correct metadata
- ✅ Enrollment succeeds and creates ACTIVE enrollment
- ✅ Course moves to Learning Pathway
- ✅ Progress percentage updates correctly
- ✅ Completion status is tracked

### Scenario 2: Assigned Course Flow
1. Admin creates and approves course
2. Admin assigns course to student
3. Student navigates to Courses tab
4. Student sees course in Assigned section
5. Student clicks Accept button
6. Course moves to Learning Pathway section
7. Assignment status changes to ACCEPTED

**Expected Results**:
- ✅ Course appears in Assigned section
- ✅ Accept button creates enrollment
- ✅ Course moves to Learning Pathway
- ✅ Assignment status updates to ACCEPTED

### Scenario 3: Filtering and Search
1. Multiple approved courses exist
2. Student searches for "React"
3. Only courses with "React" in title/description appear
4. Student filters by category "Web Development"
5. Only Web Development courses appear
6. Student filters by level "Beginner"
7. Only Beginner courses appear
8. Student clears filters
9. All courses reappear

**Expected Results**:
- ✅ Search filters by title/description
- ✅ Category filter works
- ✅ Level filter works
- ✅ Filters combine with AND logic
- ✅ Clear filters resets view

### Scenario 4: Pagination
1. 50 approved courses exist
2. Discover section shows 12 courses per page
3. Student navigates to page 2
4. Next 12 courses appear
5. Student applies filter
6. Pagination resets to page 1
7. Filtered results show with pagination

**Expected Results**:
- ✅ Pagination works correctly
- ✅ Page navigation works
- ✅ Pagination resets on filter change
- ✅ Correct number of courses per page

### Scenario 5: Error Handling
1. Student tries to enroll in unapproved course
2. Error message appears
3. Student tries to enroll twice in same course
4. Duplicate enrollment prevented
5. API fails to fetch courses
6. Error state displays with retry button
7. Student clicks retry
8. Courses load successfully

**Expected Results**:
- ✅ Unapproved course enrollment blocked
- ✅ Duplicate enrollment prevented
- ✅ Error states display correctly
- ✅ Retry functionality works

### Scenario 6: Data Consistency
1. Course has 5 enrollments
2. Discover section shows enrollment count as 5
3. New student enrolls
4. Enrollment count updates to 6
5. Student completes course (100% progress)
6. Course shows as completed
7. Course no longer appears in Learning Pathway active section

**Expected Results**:
- ✅ Enrollment count is accurate
- ✅ Enrollment count updates on new enrollment
- ✅ Progress percentage is accurate
- ✅ Completion status is tracked

## Correctness Properties

### Property 1: Enrolled courses excluded from discover
**Definition**: If a student is enrolled in a course, it SHALL NOT appear in the Discover section.

**Test**: 
```typescript
// Student is enrolled in course-1
// Discover section queries for courses where enrollments.none { userId = student }
// Result: course-1 should not appear
```

### Property 2: Enrolled courses excluded from assigned
**Definition**: If a student is enrolled in a course, it SHALL NOT appear in the Assigned section.

**Test**:
```typescript
// Student is enrolled in course-1
// Assigned section queries for CourseAssignment records
// Result: course-1 should not appear even if assigned
```

### Property 3: Assigned courses filter excludes revoked
**Definition**: The Assigned section SHALL NOT display CourseAssignment records with status REVOKED.

**Test**:
```typescript
// CourseAssignment with status REVOKED exists
// Assigned section queries for status IN [PENDING, ACCEPTED]
// Result: REVOKED assignment should not appear
```

### Property 4: Enrollment count accuracy
**Definition**: The enrollment count displayed SHALL match the actual number of active enrollments.

**Test**:
```typescript
// Course has 5 active enrollments
// Discover section displays enrollmentCount
// Result: enrollmentCount should be 5
```

### Property 5: Progress percentage accuracy
**Definition**: Progress percentage SHALL equal (lessonsCompleted / lessonsCount) * 100.

**Test**:
```typescript
// Course has 10 lessons, student completed 4
// Learning Pathway displays progressPercentage
// Result: progressPercentage should be 40
```

### Property 6: Search filters combine with AND logic
**Definition**: Multiple filters SHALL combine with AND logic (all must match).

**Test**:
```typescript
// Search: "React", Category: "Web Development", Level: "Beginner"
// Result: Only courses matching ALL three criteria appear
```

### Property 7: Filter state preservation
**Definition**: Filter state SHALL be preserved when navigating away and returning.

**Test**:
```typescript
// Apply filters: search="React", category="Web Development"
// Navigate to another section
// Return to Discover section
// Result: Filters should still be applied
```

### Property 8: Pagination state consistency
**Definition**: Pagination state SHALL remain consistent when filters change.

**Test**:
```typescript
// On page 2 with 12 items per page
// Apply filter that reduces results to 8 items
// Result: Should reset to page 1 with 8 items
```

### Property 9: Assignment status reflects database
**Definition**: Displayed assignment status SHALL match the database status.

**Test**:
```typescript
// CourseAssignment has status ACCEPTED in database
// Assigned section displays status
// Result: Status should be ACCEPTED
```

### Property 10: Enrollment creation on accept
**Definition**: Accepting an assignment SHALL create an Enrollment with status ACTIVE and progress 0%.

**Test**:
```typescript
// Student accepts CourseAssignment
// Enrollment record should be created
// Result: Enrollment.status = ACTIVE, progressPercentage = 0
```

## API Endpoints Tested

### Course Creation
- **Endpoint**: `POST /api/admin/courses`
- **Purpose**: Create a new course
- **Expected**: Course created with DRAFT status

### Course Approval
- **Endpoint**: `PATCH /api/admin/courses/:id/approve`
- **Purpose**: Approve a course
- **Expected**: Course status changes to APPROVED

### Course Assignment
- **Endpoint**: `POST /api/admin/courses/:id/assign`
- **Purpose**: Assign course to student
- **Expected**: CourseAssignment record created

### Discover Courses
- **Endpoint**: `GET /api/dashboard/courses/discover`
- **Purpose**: Get approved courses for student
- **Expected**: Returns approved courses excluding enrolled

### Assigned Courses
- **Endpoint**: `GET /api/dashboard/courses/assigned`
- **Purpose**: Get courses assigned to student
- **Expected**: Returns CourseAssignment records with status PENDING/ACCEPTED

### Enrolled Courses
- **Endpoint**: `GET /api/dashboard/courses/enrolled`
- **Purpose**: Get courses student is enrolled in
- **Expected**: Returns Enrollment records with status ACTIVE

### Enroll in Course
- **Endpoint**: `POST /api/dashboard/courses/enroll`
- **Purpose**: Enroll student in course
- **Expected**: Creates Enrollment record with ACTIVE status

### Accept Assignment
- **Endpoint**: `POST /api/dashboard/courses/assign/accept`
- **Purpose**: Accept assigned course
- **Expected**: Updates assignment status and creates enrollment

## Debugging Failed Tests

### Test fails: "Course not found in discover"
**Possible causes**:
- Course approval status is not APPROVED
- Course is archived
- Student is already enrolled
- Query filter is incorrect

**Debug steps**:
1. Check course approvalStatus in database
2. Check course archivedAt is null
3. Check no enrollment exists for student
4. Verify query includes correct WHERE clause

### Test fails: "Enrollment count mismatch"
**Possible causes**:
- Enrollment count not updated after new enrollment
- Query includes inactive enrollments
- Database transaction not committed

**Debug steps**:
1. Check all enrollments for course
2. Filter for status = ACTIVE only
3. Verify transaction committed
4. Check for race conditions

### Test fails: "Progress percentage incorrect"
**Possible causes**:
- Lesson completion not tracked
- Progress calculation wrong
- Rounding error

**Debug steps**:
1. Check lessonProgress records
2. Verify calculation: (completed / total) * 100
3. Check for floating point precision issues
4. Verify lesson count is correct

### Test fails: "Filter state not preserved"
**Possible causes**:
- State not saved to localStorage/sessionStorage
- State cleared on navigation
- Component re-renders and resets state

**Debug steps**:
1. Check state persistence mechanism
2. Verify state survives navigation
3. Check component lifecycle
4. Verify useEffect dependencies

## Performance Considerations

### Query Optimization
- Use pagination to limit results
- Index frequently filtered columns
- Use select to fetch only needed fields
- Avoid N+1 queries

### Caching Strategy
- Cache approved courses list
- Cache student's enrollments
- Invalidate cache on mutations
- Use SWR or React Query for automatic cache management

### Pagination
- Default page size: 12 items
- Maximum page size: 100 items
- Fetch next page on scroll or button click
- Maintain scroll position

## Common Issues and Solutions

### Issue: Tests timeout
**Solution**: Increase Jest timeout in test file
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Mock not working
**Solution**: Clear mocks before each test
```typescript
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});
```

### Issue: Async test fails
**Solution**: Use async/await properly
```typescript
it("should work", async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Issue: Database state inconsistent
**Solution**: Use transactions and rollback
```typescript
await prisma.$transaction(async (tx) => {
  // All operations here
  // Rollback on error
});
```

## Next Steps

1. **Run the tests**: Execute the test files to validate the course flow
2. **Review results**: Check which tests pass and which fail
3. **Fix failures**: Address any failing tests
4. **Add more tests**: Expand test coverage for edge cases
5. **Performance test**: Test with large datasets
6. **Load test**: Test with concurrent users
7. **Integration test**: Test with real database
8. **E2E test**: Test with real UI and browser

## References

- [Jest Documentation](https://jestjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Property-Based Testing](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Fast-Check Documentation](https://github.com/dubzzz/fast-check)

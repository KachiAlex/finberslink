# Implementation Plan

## Phase 1: Exploration - Understand the Bug

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - PostgreSQL Enum Type Mismatch on String Literals
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - Call affected endpoints that use string literal enum comparisons
    - Assert that queries execute successfully without PostgreSQL type mismatch errors
    - Verify that responses contain expected data
  - The test assertions should match the Expected Behavior Properties from design:
    - Queries using `status: "ACTIVE"` should execute without "operator does not exist: text = 'EnrollmentStatus'" errors
    - Queries using `status: "SUSPENDED"` should execute without "operator does not exist: text = 'UserStatus'" errors
    - Queries using `status: { in: ['ACTIVE', 'PENDING_ACCEPTANCE'] }` should execute without type errors
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Record specific PostgreSQL error messages
    - Note which endpoints/queries fail
    - Identify the pattern of string literal enum comparisons
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

## Phase 2: Preservation - Verify Non-Buggy Behavior

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Enum Queries and Existing Enum References Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Queries on non-enum columns (text, numbers, dates) should work correctly
    - Queries that already use proper enum references should work correctly
    - Queries with multiple filter conditions should apply all filters
    - API responses should serialize correctly
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all non-enum column queries, results should match expected data
    - For all queries with multiple filters, all filters should be applied
    - For all API responses, enum values should serialize correctly
    - For all non-buggy queries, behavior should be identical before and after fix
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Phase 3: Implementation - Apply the Fix

- [x] 3. Fix PostgreSQL enum comparison errors across all affected files

  - [x] 3.1 Fix src/app/api/dashboard/courses/learning-pathway/route.ts
    - Add import: `import { EnrollmentStatus } from "@prisma/client";`
    - Replace `status: "ACTIVE"` with `status: EnrollmentStatus.ACTIVE`
    - Verify all enrollment status comparisons use proper enum references
    - _Bug_Condition: String literal enum comparisons in WHERE clauses_
    - _Expected_Behavior: Queries execute successfully without PostgreSQL type errors_
    - _Preservation: Non-enum queries and other filters continue to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [x] 3.2 Fix src/features/dashboard/service.ts
    - Add import: `import { EnrollmentStatus } from "@prisma/client";`
    - Replace all `status: "ACTIVE"` with `status: EnrollmentStatus.ACTIVE`
    - Replace all `status: "PENDING_ACCEPTANCE"` with `status: EnrollmentStatus.PENDING_ACCEPTANCE`
    - Replace array literals: `{ in: ['ACTIVE', 'PENDING_ACCEPTANCE'] }` with `{ in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING_ACCEPTANCE] }`
    - Verify all enrollment status comparisons use proper enum references
    - _Bug_Condition: String literal enum comparisons in WHERE clauses_
    - _Expected_Behavior: Queries execute successfully without PostgreSQL type errors_
    - _Preservation: Non-enum queries and other filters continue to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [x] 3.3 Fix src/features/admin/service.ts
    - Add imports: `import { EnrollmentStatus, UserStatus, InviteStatus } from "@prisma/client";`
    - Replace all `status: 'ACTIVE'` with appropriate enum reference (EnrollmentStatus.ACTIVE, UserStatus.ACTIVE, etc.)
    - Replace all `status: 'SUSPENDED'` with appropriate enum reference (UserStatus.SUSPENDED, etc.)
    - Replace all `status: 'INVITED'` with appropriate enum reference (InviteStatus.INVITED, etc.)
    - Replace array literals: `{ in: ['ACTIVE', 'SUSPENDED', 'INVITED'] }` with proper enum arrays
    - Verify all user and enrollment status comparisons use proper enum references
    - _Bug_Condition: String literal enum comparisons in WHERE clauses_
    - _Expected_Behavior: Queries execute successfully without PostgreSQL type errors_
    - _Preservation: Non-enum queries and other filters continue to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [ ] 3.4 Fix src/features/dashboard/insights.ts
    - Add import: `import { UserStatus } from "@prisma/client";`
    - Replace `status: "ACTIVE"` with `status: UserStatus.ACTIVE`
    - Verify all user status comparisons use proper enum references
    - _Bug_Condition: String literal enum comparisons in WHERE clauses_
    - _Expected_Behavior: Queries execute successfully without PostgreSQL type errors_
    - _Preservation: Non-enum queries and other filters continue to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [x] 3.5 Fix src/features/superadmin/dashboard.ts
    - Add imports: `import { TenantStatus, UserStatus } from "@prisma/client";`
    - Replace all `status: "ACTIVE"` with appropriate enum reference (TenantStatus.ACTIVE, UserStatus.ACTIVE, etc.)
    - Replace all `status: "SUSPENDED"` with appropriate enum reference (TenantStatus.SUSPENDED, UserStatus.SUSPENDED, etc.)
    - Replace array literals with proper enum arrays
    - Verify all tenant and user status comparisons use proper enum references
    - _Bug_Condition: String literal enum comparisons in WHERE clauses_
    - _Expected_Behavior: Queries execute successfully without PostgreSQL type errors_
    - _Preservation: Non-enum queries and other filters continue to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [ ] 3.6 Fix src/features/news/service.ts
    - Search for any string literal enum comparisons in this file
    - Add necessary enum imports from `@prisma/client`
    - Replace all string literal enum comparisons with proper enum references
    - Verify all enum comparisons use proper enum types
    - _Bug_Condition: String literal enum comparisons in WHERE clauses_
    - _Expected_Behavior: Queries execute successfully without PostgreSQL type errors_
    - _Preservation: Non-enum queries and other filters continue to work_
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - PostgreSQL Enum Type Mismatch Fixed
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify all affected endpoints return 200 with valid data
    - Verify no PostgreSQL type mismatch errors occur
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Enum Queries and Existing Enum References Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - Verify non-enum queries continue to work correctly
    - Verify multiple filter conditions continue to apply correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Phase 4: Checkpoint

- [x] 4. Checkpoint - Ensure all tests pass
  - Verify all exploration tests pass (bug is fixed)
  - Verify all preservation tests pass (no regressions)
  - Verify all affected endpoints return correct responses
  - Verify no PostgreSQL type mismatch errors in logs
  - Confirm fix is complete and ready for deployment

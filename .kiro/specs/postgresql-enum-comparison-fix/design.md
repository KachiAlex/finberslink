# PostgreSQL Enum Comparison Fix - Design Document

## Overview

PostgreSQL enum columns are being compared against string literals instead of proper Prisma enum references, causing "operator does not exist: text = 'EnrollmentStatus'" errors. This manifests as 500 errors on endpoints like `/api/dashboard/courses/learning-pathway` and other API routes that query enum columns. The fix requires systematically replacing all string literal enum comparisons with proper enum values imported from `@prisma/client` (e.g., `EnrollmentStatus.ACTIVE` instead of `"ACTIVE"`). This is a targeted, minimal fix that updates WHERE clauses in Prisma queries to use the correct enum type, ensuring PostgreSQL can properly compare enum columns with their corresponding enum values.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a Prisma query uses a string literal to compare an enum column (e.g., `status: "ACTIVE"` instead of `status: EnrollmentStatus.ACTIVE`)
- **Property (P)**: The desired behavior when enum comparisons are performed - queries should execute successfully and return correct results without PostgreSQL type mismatch errors
- **Preservation**: Existing behavior for non-enum columns and other query patterns that must remain unchanged by the fix
- **EnrollmentStatus**: Prisma enum type from `@prisma/client` with values: PENDING_ACCEPTANCE, ACTIVE, COMPLETED
- **UserStatus**: Prisma enum type from `@prisma/client` with values: ACTIVE, SUSPENDED, INVITED
- **TenantStatus**: Prisma enum type from `@prisma/client` with values: ACTIVE, SUSPENDED, TRIAL
- **String Literal Enum Comparison**: Using `"ACTIVE"` or `'ACTIVE'` instead of the proper enum reference like `EnrollmentStatus.ACTIVE`
- **Prisma Query**: Database query using Prisma client with WHERE clauses that filter by enum columns

## Bug Details

### Bug Condition

The bug manifests when a Prisma query compares an enum column against a string literal instead of a proper enum reference. PostgreSQL enum types require exact type matching - comparing a text value to an enum column fails with "operator does not exist: text = 'EnumType'" error. The `handleKeyPress` function is either not correctly identifying the button to trigger, not finding the button element in the DOM, or not successfully invoking the button's click handler.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PrismaQuery
  OUTPUT: boolean
  
  RETURN input.whereClause.enumColumn IN ['status', 'userStatus', 'tenantStatus', ...]
         AND input.whereClause.comparisonValue IS string literal (e.g., "ACTIVE", 'SUSPENDED')
         AND input.whereClause.comparisonValue IS NOT enum reference (e.g., EnrollmentStatus.ACTIVE)
         AND PostgreSQL enum type mismatch occurs
END FUNCTION
```

### Examples

**Example 1: Enrollment Status String Literal (BUGGY)**
```typescript
// Current buggy code in src/app/api/dashboard/courses/learning-pathway/route.ts
const enrollments = await prisma.enrollment.findMany({
  where: {
    userId: session.sub,
    status: "ACTIVE",  // BUG: String literal instead of EnrollmentStatus.ACTIVE
  },
});
// Result: PostgreSQL error "operator does not exist: text = 'EnrollmentStatus'"
```

**Example 1: Enrollment Status Enum Reference (FIXED)**
```typescript
// Fixed code with proper enum import and reference
import { EnrollmentStatus } from "@prisma/client";

const enrollments = await prisma.enrollment.findMany({
  where: {
    userId: session.sub,
    status: EnrollmentStatus.ACTIVE,  // FIXED: Proper enum reference
  },
});
// Result: Query executes successfully, returns matching enrollments
```

**Example 2: User Status String Literal (BUGGY)**
```typescript
// Current buggy code in src/features/admin/service.ts
prisma.user.count({ where: { role: 'TUTOR', status: 'ACTIVE', ...tenantWhere } })
// Result: PostgreSQL error "operator does not exist: text = 'UserStatus'"
```

**Example 2: User Status Enum Reference (FIXED)**
```typescript
// Fixed code with proper enum import and reference
import { UserStatus } from "@prisma/client";

prisma.user.count({ where: { role: 'TUTOR', status: UserStatus.ACTIVE, ...tenantWhere } })
// Result: Query executes successfully, returns correct count
```

**Example 3: Tenant Status String Literal (BUGGY)**
```typescript
// Current buggy code in src/features/superadmin/dashboard.ts
prisma.tenant.count({ where: { status: "ACTIVE" } })
// Result: PostgreSQL error "operator does not exist: text = 'TenantStatus'"
```

**Example 3: Tenant Status Enum Reference (FIXED)**
```typescript
// Fixed code with proper enum import and reference
import { TenantStatus } from "@prisma/client";

prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } })
// Result: Query executes successfully, returns correct count
```

**Edge Case: Array of String Literals (BUGGY)**
```typescript
// Current buggy code using array of string literals
const enrollments = await prisma.enrollment.findMany({
  where: {
    userId: options.userId,
    status: { in: ['ACTIVE', 'PENDING_ACCEPTANCE'] },  // BUG: Array of strings
  },
});
// Result: PostgreSQL error "operator does not exist: text = 'EnrollmentStatus'"
```

**Edge Case: Array of Enum References (FIXED)**
```typescript
// Fixed code using array of enum references
import { EnrollmentStatus } from "@prisma/client";

const enrollments = await prisma.enrollment.findMany({
  where: {
    userId: options.userId,
    status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING_ACCEPTANCE] },  // FIXED
  },
});
// Result: Query executes successfully, returns matching enrollments
```

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Queries using non-enum columns with string values must continue to work exactly as before (e.g., `firstName: { contains: "John" }`)
- Queries that already use proper enum references must continue to work without changes
- Filtering by multiple criteria alongside enum comparisons must continue to apply all filters correctly
- Enum values returned in API responses must continue to serialize correctly
- Pagination, sorting, and other query options must continue to work as before
- Error handling and logging for database errors must continue to function

**Scope:**
All inputs that do NOT involve string literal enum comparisons should be completely unaffected by this fix. This includes:
- Queries on non-enum columns (text, numbers, dates, etc.)
- Queries that already use proper enum references
- Queries with complex WHERE conditions mixing enum and non-enum filters
- Queries using `findUnique`, `findFirst`, `update`, `delete`, and other Prisma operations
- All other application logic outside of Prisma query WHERE clauses

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Incorrect Enum Type Usage**: The code is using string literals (e.g., `"ACTIVE"`) instead of importing and using the proper Prisma enum types (e.g., `EnrollmentStatus.ACTIVE`). PostgreSQL enums require exact type matching and cannot implicitly convert text to enum types.

2. **Missing Enum Imports**: The affected files do not import the necessary enum types from `@prisma/client`, making it impossible to use the correct enum references even if the code was updated.

3. **Inconsistent Pattern Across Files**: Multiple files have this issue independently, suggesting a systemic problem where developers were not aware of the requirement to use enum types for enum column comparisons.

4. **PostgreSQL Enum Type Strictness**: Unlike some databases that allow implicit text-to-enum conversion, PostgreSQL requires explicit enum type matching. The application was likely developed or tested against a more lenient database system.

## Correctness Properties

Property 1: Bug Condition - Enum Comparisons Use Proper Types

_For any_ Prisma query where an enum column is compared against a value, the fixed code SHALL use the proper enum type reference (e.g., `EnrollmentStatus.ACTIVE`) instead of a string literal (e.g., `"ACTIVE"`), ensuring PostgreSQL can successfully execute the query without type mismatch errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Enum Queries Unchanged

_For any_ Prisma query that does NOT involve enum column comparisons (queries on text, number, date columns, or queries already using proper enum references), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for non-buggy queries.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the fix involves three systematic changes across all affected files:

**File**: `src/app/api/dashboard/courses/learning-pathway/route.ts`

**Specific Changes**:
1. **Add Enum Import**: Import `EnrollmentStatus` from `@prisma/client` at the top of the file
2. **Replace String Literal**: Change `status: "ACTIVE"` to `status: EnrollmentStatus.ACTIVE` in the WHERE clause
3. **Verify Query Execution**: Ensure the query now executes without PostgreSQL type errors

**File**: `src/features/dashboard/service.ts`

**Specific Changes**:
1. **Add Enum Import**: Import `EnrollmentStatus` from `@prisma/client` at the top of the file
2. **Replace String Literals in Array**: Change `{ in: ['ACTIVE', 'PENDING_ACCEPTANCE'] }` to `{ in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING_ACCEPTANCE] }` if applicable
3. **Verify Query Execution**: Ensure all enrollment status queries execute without errors

**File**: `src/features/admin/service.ts`

**Specific Changes**:
1. **Add Enum Imports**: Import `EnrollmentStatus`, `UserStatus`, `InviteStatus` from `@prisma/client` at the top of the file
2. **Replace String Literals**: Change all instances of `status: 'ACTIVE'`, `status: 'SUSPENDED'`, `status: 'INVITED'` to use proper enum references
3. **Replace Array Literals**: Change `{ in: ['ACTIVE', 'SUSPENDED', 'INVITED'] }` to use proper enum arrays
4. **Verify Query Execution**: Ensure all user and enrollment status queries execute without errors

**File**: `src/features/dashboard/insights.ts`

**Specific Changes**:
1. **Add Enum Import**: Import `UserStatus` from `@prisma/client` at the top of the file
2. **Replace String Literal**: Change `status: "ACTIVE"` to `status: UserStatus.ACTIVE` in the WHERE clause
3. **Verify Query Execution**: Ensure the query now executes without PostgreSQL type errors

**File**: `src/features/superadmin/dashboard.ts`

**Specific Changes**:
1. **Add Enum Import**: Import `TenantStatus`, `UserStatus` from `@prisma/client` at the top of the file
2. **Replace String Literals**: Change `status: "ACTIVE"` to `status: TenantStatus.ACTIVE` and `status: "SUSPENDED"` to `status: TenantStatus.SUSPENDED`
3. **Verify Query Execution**: Ensure all tenant status queries execute without errors

**File**: `src/features/news/service.ts`

**Specific Changes**:
1. **Identify Enum Comparisons**: Search for any string literal enum comparisons in this file
2. **Add Enum Imports**: Import necessary enum types from `@prisma/client`
3. **Replace String Literals**: Update all enum comparisons to use proper enum references
4. **Verify Query Execution**: Ensure all queries execute without errors

**General Pattern for All Files**:
1. Search for patterns like `status: "ACTIVE"`, `status: 'SUSPENDED'`, `status: { in: ['ACTIVE', ...] }`
2. Identify which enum type each status field uses (EnrollmentStatus, UserStatus, TenantStatus, etc.)
3. Add the necessary enum imports from `@prisma/client`
4. Replace all string literals with proper enum references
5. Test that queries execute successfully

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that call the affected endpoints (e.g., `/api/dashboard/courses/learning-pathway`) and assert that they return successful responses with correct data. Run these tests on the UNFIXED code to observe PostgreSQL type mismatch errors and understand the root cause.

**Test Cases**:
1. **Learning Pathway Endpoint Test**: Call GET `/api/dashboard/courses/learning-pathway` with authenticated user (will fail on unfixed code with 500 error)
2. **Admin Dashboard Test**: Call admin dashboard functions that query user status (will fail on unfixed code with PostgreSQL error)
3. **Superadmin Dashboard Test**: Call superadmin dashboard functions that query tenant status (will fail on unfixed code with PostgreSQL error)
4. **Insights Query Test**: Call dashboard insights functions that query user status (will fail on unfixed code with PostgreSQL error)

**Expected Counterexamples**:
- Endpoints return 500 errors with "operator does not exist: text = 'EnrollmentStatus'" in error logs
- Endpoints return 500 errors with "operator does not exist: text = 'UserStatus'" in error logs
- Endpoints return 500 errors with "operator does not exist: text = 'TenantStatus'" in error logs
- Possible causes: string literal enum comparisons in WHERE clauses, missing enum type imports

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL query WHERE isBugCondition(query) DO
  result := fixedQuery(query)
  ASSERT result.success = true
  ASSERT result.data IS NOT null
  ASSERT PostgreSQL error does NOT occur
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL query WHERE NOT isBugCondition(query) DO
  ASSERT originalQuery(query) = fixedQuery(query)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy queries

**Test Plan**: Observe behavior on UNFIXED code first for non-enum queries and other interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Non-Enum Column Queries**: Verify queries on text, number, and date columns continue to work correctly
2. **Already-Fixed Queries**: Verify queries that already use proper enum references continue to work
3. **Complex Filter Queries**: Verify queries with multiple filter conditions continue to apply all filters correctly
4. **Response Serialization**: Verify enum values in API responses continue to serialize correctly

### Unit Tests

- Test that `/api/dashboard/courses/learning-pathway` endpoint returns 200 with valid course data
- Test that admin dashboard functions return correct user counts by status
- Test that superadmin dashboard functions return correct tenant counts by status
- Test that dashboard insights functions return correct user counts
- Test that queries with multiple filter conditions work correctly
- Test edge cases (empty results, single result, multiple results)

### Property-Based Tests

- Generate random user IDs and verify enrollment queries return correct results
- Generate random filter combinations and verify all filters are applied correctly
- Generate random status values and verify queries execute without type errors
- Test that non-enum queries continue to work across many scenarios

### Integration Tests

- Test full learning pathway endpoint flow with authenticated user
- Test admin dashboard with various user statuses
- Test superadmin dashboard with various tenant statuses
- Test that API responses serialize enum values correctly
- Test that filtering and sorting work correctly with enum comparisons

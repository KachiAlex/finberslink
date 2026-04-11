# Missing Service Exports Bugfix Design

## Overview

The application has 310+ build errors caused by missing service exports across multiple feature modules and library files. The bug manifests when the build process attempts to resolve imports from service files that either don't exist or don't export the required functions. The fix involves systematically identifying all missing exports, creating missing files where needed, and adding proper exports to existing files. This is a comprehensive refactoring to ensure all imported functions are properly exported from their source modules.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the build process attempts to resolve imports from service files that don't exist or don't export required functions
- **Property (P)**: The desired behavior when imports are resolved - all required functions should be properly exported and the build should succeed
- **Preservation**: Existing functionality and exports that must remain unchanged by the fix
- **Service Module**: A TypeScript file in the features or lib directories that exports business logic functions
- **Missing Export**: A function that is imported in the codebase but not exported from its source module
- **Module Resolution**: The process by which the build system locates and loads imported modules

## Bug Details

### Bug Condition

The bug manifests when the build process attempts to resolve imports from service modules across the codebase. The affected modules include:

**Feature Service Modules:**
- `features/admin/service` - Missing exports: assignCourseToStudent, assignCourseToStudentsBulk, updateStudentStatus, updateUserRole, updateUserStatus, createTenantInvite, listAllUsers, listAssignableCourses, listRecentCourseAssignmentEvents, listStudentAssignedCourses, unassignCourseFromStudent
- `features/chat/hooks` - Missing exports: useChatSpaces, useDirectConversations, useConversationMessages, useSendDirectMessage, useCreateDirectConversation
- `features/chat/components/user-avatar` - File doesn't exist
- `features/interview/ai` - Missing exports: analyzeATSMatch, analyzeSkills, optimizeResumeSummary, transcribeInterviewAudio
- `features/interview/audio-service` - File doesn't exist
- `features/interview/service` - Missing exports: createInterviewSession, addInterviewQuestion, assertSessionOwnership, assertQuestionOwnership
- `features/interview/analytics-service` - Missing exports: getRoleAverageScore
- `features/forum/service` - Missing exports: listPostReplies, listThreadPosts, addPostReaction
- `features/tutor/service` - Missing exports: createTutorExam, upsertTutorCourseDraft, submitTutorCourse, submitTutorExam, getTutorCourseForEdit
- `features/jobs/alerts.service` - Missing exports: deleteJobAlert, findMatchingJobs, getJobAlertById, updateJobAlert, createJobAlert, createJobPosting
- `features/companies/service` - Missing exports: getCompanyBySlug, getCompanyJobs, getCompanyStats

**Library Modules:**
- `lib/auth/guards` - Missing exports: withAuth (exists as requireAuth)
- `lib/auth/jwt` - Missing exports: verifyToken
- `lib/auth/session` - Missing exports: requireSession
- `lib/security/rate-limit` - Missing exports: createRateLimit, rateLimitPresets
- `lib/ai/resume` - Missing exports: generateAchievementsFromContext
- `lib/validation/auth-schemas` - Missing exports: LoginSchema, RegisterSchema, ResetPasswordSchema
- `lib/cloudinary` - Missing exports: cloudinary, uploadToCloudinary

**Component/Hook Modules:**
- `features/chat/components/user-avatar` - File doesn't exist
- `features/chat/hooks` - Missing exports for chat hooks
- `components/ai/bullet-suggestions` - File doesn't exist
- `components/current-user-provider` - Missing exports: useCurrentUserId

**Formal Specification:**
```
FUNCTION isBugCondition(importPath, exportName)
  INPUT: importPath of type string (e.g., "features/admin/service")
         exportName of type string (e.g., "assignCourseToStudent")
  OUTPUT: boolean
  
  RETURN moduleFileDoesNotExist(importPath)
         OR (moduleFileExists(importPath) AND NOT exportExists(importPath, exportName))
         OR exportHasDifferentName(importPath, exportName)
END FUNCTION
```

### Examples

- **Example 1**: Build attempts to import `assignCourseToStudent` from `features/admin/service`, but this function doesn't exist in the file. Result: "Module not found" error
- **Example 2**: Build attempts to import `useChatSpaces` from `features/chat/hooks`, but the hooks file doesn't export this function. Result: "Module not found" error
- **Example 3**: Build attempts to import `UserAvatar` from `features/chat/components/user-avatar`, but the file doesn't exist. Result: "Module not found" error
- **Example 4**: Build attempts to import `createRateLimit` from `lib/security/rate-limit`, but only `checkRateLimit` is exported. Result: "Module not found" error
- **Example 5**: Build attempts to import `verifyToken` from `lib/auth/jwt`, but the file doesn't export this function. Result: "Module not found" error

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All existing exports from service modules must continue to work exactly as before
- All existing functionality in components and hooks must remain unchanged
- All existing API routes and pages that don't depend on missing exports must continue to work
- All existing database operations and business logic must remain unchanged
- All existing authentication and authorization mechanisms must continue to work

**Scope:**
All imports that are already working correctly should be completely unaffected by this fix. This includes:
- Existing exports from `features/admin/service` (requireAdminUser, archiveCourse, restoreCourse, approveCourseEdit, rejectCourseEdit)
- Existing exports from `lib/auth/guards` (requireAuth, handleAuthError, AuthError)
- Existing exports from `lib/security/rate-limit` (checkRateLimit)
- All other working imports throughout the codebase

## Hypothesized Root Cause

Based on the bug description and build errors, the most likely issues are:

1. **Missing Function Implementations**: Many functions are imported but never implemented in their source files. These need to be created with proper implementations or placeholder implementations.

2. **Missing Files**: Some modules are imported but the files don't exist at all (e.g., `features/chat/components/user-avatar`, `features/interview/audio-service`). These files need to be created.

3. **Incorrect Export Names**: Some functions exist but are exported with different names than what's being imported. The exports need to be renamed or aliases created.

4. **Missing Barrel Files**: Some directories have multiple files but no index.ts barrel file to re-export all functions. Barrel files need to be created.

5. **Incomplete Module Structure**: Some feature modules are partially implemented with some functions exported but others missing. These need to be completed.

## Correctness Properties

Property 1: Bug Condition - All Missing Exports Are Resolved

_For any_ import statement where the bug condition holds (module doesn't exist or doesn't export the required function), the fixed codebase SHALL have the module file created and the required function properly exported, allowing the build to succeed without "Module not found" errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Existing Exports Remain Unchanged

_For any_ import statement where the bug condition does NOT hold (module exists and exports the required function), the fixed codebase SHALL produce exactly the same exports and behavior as the original code, preserving all existing functionality and not breaking any working imports.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

The fix requires creating missing files and adding missing exports across multiple modules. The implementation follows this strategy:

**File: `src/features/admin/service.ts`**
- Add missing exports: assignCourseToStudent, assignCourseToStudentsBulk, updateStudentStatus, updateUserRole, updateUserStatus, createTenantInvite, listAllUsers, listAssignableCourses, listRecentCourseAssignmentEvents, listStudentAssignedCourses, unassignCourseFromStudent
- Implementation: Add function stubs or full implementations based on business logic

**File: `src/features/chat/hooks/index.ts`** (Create if missing)
- Add missing exports: useChatSpaces, useDirectConversations, useConversationMessages, useSendDirectMessage, useCreateDirectConversation
- Implementation: Create hook implementations or import from individual files

**File: `src/features/chat/components/user-avatar.tsx`** (Create)
- Export: UserAvatar component
- Implementation: Create component implementation

**File: `src/features/interview/ai.ts`**
- Add missing exports: analyzeATSMatch, analyzeSkills, optimizeResumeSummary, transcribeInterviewAudio
- Implementation: Add function implementations

**File: `src/features/interview/audio-service.ts`** (Create)
- Export: uploadAudioFile, getAudioDuration
- Implementation: Create service implementation

**File: `src/features/interview/service.ts`**
- Add missing exports: createInterviewSession, addInterviewQuestion, assertSessionOwnership, assertQuestionOwnership
- Implementation: Add function implementations

**File: `src/features/interview/analytics-service.ts`**
- Add missing exports: getRoleAverageScore
- Implementation: Add function implementation

**File: `src/features/forum/service.ts`**
- Add missing exports: listPostReplies, listThreadPosts, addPostReaction
- Implementation: Add function implementations

**File: `src/features/tutor/service.ts`**
- Add missing exports: createTutorExam, upsertTutorCourseDraft, submitTutorCourse, submitTutorExam, getTutorCourseForEdit
- Implementation: Add function implementations

**File: `src/features/jobs/alerts.service.ts`**
- Add missing exports: deleteJobAlert, findMatchingJobs, getJobAlertById, updateJobAlert, createJobAlert, createJobPosting
- Implementation: Add function implementations

**File: `src/features/companies/service.ts`**
- Add missing exports: getCompanyBySlug, getCompanyJobs, getCompanyStats
- Implementation: Add function implementations

**File: `src/lib/auth/guards.ts`**
- Add missing exports: withAuth (alias for requireAuth or new implementation)
- Implementation: Add or alias function

**File: `src/lib/auth/jwt.ts`**
- Add missing exports: verifyToken
- Implementation: Add function implementation

**File: `src/lib/auth/session.ts`**
- Add missing exports: requireSession
- Implementation: Add function implementation

**File: `src/lib/security/rate-limit.ts`**
- Add missing exports: createRateLimit, rateLimitPresets
- Implementation: Add function implementations

**File: `src/lib/ai/resume.ts`**
- Add missing exports: generateAchievementsFromContext
- Implementation: Add function implementation

**File: `src/lib/validation/auth-schemas.ts`** (Create if missing)
- Export: LoginSchema, RegisterSchema, ResetPasswordSchema
- Implementation: Create Zod schema definitions

**File: `src/lib/cloudinary.ts`**
- Add missing exports: cloudinary, uploadToCloudinary
- Implementation: Add function implementations

**File: `src/components/ai/bullet-suggestions.tsx`** (Create)
- Export: BulletSuggestions component
- Implementation: Create component implementation

**File: `src/components/current-user-provider.tsx`**
- Add missing exports: useCurrentUserId
- Implementation: Add hook implementation

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify that the build fails with the expected errors on unfixed code, then verify that the fix resolves all module resolution errors and the build succeeds.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that module resolution errors exist for all missing exports.

**Test Plan**: Run the build process on unfixed code and capture all "Module not found" errors. Verify that each error corresponds to a missing export or missing file.

**Test Cases**:
1. **Build Error Verification**: Run `npm run build` on unfixed code and verify 310+ "Module not found" errors
2. **Missing Export Verification**: For each error, verify that the module file either doesn't exist or doesn't export the required function
3. **Import Path Verification**: Verify that all import paths in the codebase match the expected module locations
4. **Export Name Verification**: Verify that all imported function names don't exist in their source modules

**Expected Counterexamples**:
- Build fails with "Module not found: Can't resolve 'features/admin/service'" errors
- Build fails with "Module not found: Can't resolve 'lib/auth/guards'" errors
- Build fails with "Module not found: Can't resolve 'features/chat/components/user-avatar'" errors
- Possible causes: missing files, missing exports, incorrect export names

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed codebase resolves all module imports and the build succeeds.

**Pseudocode:**
```
FOR ALL importPath, exportName WHERE isBugCondition(importPath, exportName) DO
  result := buildProcess()
  ASSERT result.success = true
  ASSERT moduleCanBeResolved(importPath, exportName)
  ASSERT exportIsAccessible(importPath, exportName)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all imports where the bug condition does NOT hold, the fixed codebase produces the same behavior as the original code.

**Pseudocode:**
```
FOR ALL importPath, exportName WHERE NOT isBugCondition(importPath, exportName) DO
  ASSERT originalBehavior(importPath, exportName) = fixedBehavior(importPath, exportName)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the import domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all working imports

**Test Plan**: Observe behavior on unfixed code for working imports, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Existing Export Preservation**: Verify that existing exports from admin service continue to work
2. **Existing Export Preservation**: Verify that existing exports from auth guards continue to work
3. **Existing Export Preservation**: Verify that existing exports from rate-limit continue to work
4. **Build Success Preservation**: Verify that the build succeeds after all fixes are applied

### Unit Tests

- Test that each missing function is properly exported from its module
- Test that each missing file is created with proper exports
- Test that each function has the correct signature and can be imported
- Test that no existing exports are broken or changed

### Property-Based Tests

- Generate random import paths and verify they can be resolved
- Generate random export names and verify they exist in their modules
- Test that all imports throughout the codebase can be resolved
- Test that the build succeeds with all fixes applied

### Integration Tests

- Run full build process and verify it succeeds
- Run application in development mode and verify no import errors
- Run application in production build mode and verify no import errors
- Test that all API routes and pages load correctly with fixed imports

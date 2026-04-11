 # Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Build Fails with Module Resolution Errors
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design
  - The test assertions should match the Expected Behavior Properties from design
  - Run `npm run build` on UNFIXED code and capture all "Module not found" errors
  - Verify that each error corresponds to a missing export or missing file
  - Document all 310+ build errors found
  - **EXPECTED OUTCOME**: Build FAILS with 310+ "Module not found" errors (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Exports Continue to Work
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for working imports (imports that don't trigger the bug)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test that existing exports from admin service (requireAdminUser, archiveCourse, restoreCourse, approveCourseEdit, rejectCourseEdit) work correctly
  - Test that existing exports from auth guards (requireAuth, handleAuthError, AuthError) work correctly
  - Test that existing exports from rate-limit (checkRateLimit) work correctly
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [-] 3. Fix missing service exports

  - [x] 3.1 Create missing files and add missing exports to feature service modules
    - Create `src/features/chat/components/user-avatar.tsx` with UserAvatar component export
    - Create `src/features/interview/audio-service.ts` with uploadAudioFile, getAudioDuration exports
    - Create `src/features/chat/hooks/index.ts` barrel file with chat hook exports
    - Add missing exports to `src/features/admin/service.ts`: assignCourseToStudent, assignCourseToStudentsBulk, updateStudentStatus, updateUserRole, updateUserStatus, createTenantInvite, listAllUsers, listAssignableCourses, listRecentCourseAssignmentEvents, listStudentAssignedCourses, unassignCourseFromStudent
    - Add missing exports to `src/features/interview/ai.ts`: analyzeATSMatch, analyzeSkills, optimizeResumeSummary, transcribeInterviewAudio
    - Add missing exports to `src/features/interview/service.ts`: createInterviewSession, addInterviewQuestion, assertSessionOwnership, assertQuestionOwnership
    - Add missing exports to `src/features/interview/analytics-service.ts`: getRoleAverageScore
    - Add missing exports to `src/features/forum/service.ts`: listPostReplies, listThreadPosts, addPostReaction
    - Add missing exports to `src/features/tutor/service.ts`: createTutorExam, upsertTutorCourseDraft, submitTutorCourse, submitTutorExam, getTutorCourseForEdit
    - Add missing exports to `src/features/jobs/alerts.service.ts`: deleteJobAlert, findMatchingJobs, getJobAlertById, updateJobAlert, createJobAlert, createJobPosting
    - Add missing exports to `src/features/companies/service.ts`: getCompanyBySlug, getCompanyJobs, getCompanyStats
    - _Bug_Condition: isBugCondition(importPath, exportName) from design_
    - _Expected_Behavior: expectedBehavior(result) from design_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.2 Create missing files and add missing exports to library modules
    - Create `src/lib/validation/auth-schemas.ts` with LoginSchema, RegisterSchema, ResetPasswordSchema exports
    - Add missing exports to `src/lib/auth/guards.ts`: withAuth
    - Add missing exports to `src/lib/auth/jwt.ts`: verifyToken
    - Add missing exports to `src/lib/auth/session.ts`: requireSession
    - Add missing exports to `src/lib/security/rate-limit.ts`: createRateLimit, rateLimitPresets
    - Add missing exports to `src/lib/ai/resume.ts`: generateAchievementsFromContext
    - Add missing exports to `src/lib/cloudinary.ts`: cloudinary, uploadToCloudinary
    - _Bug_Condition: isBugCondition(importPath, exportName) from design_
    - _Expected_Behavior: expectedBehavior(result) from design_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.3 Create missing files and add missing exports to component modules
    - Create `src/components/ai/bullet-suggestions.tsx` with BulletSuggestions component export
    - Add missing exports to `src/components/current-user-provider.tsx`: useCurrentUserId
    - _Bug_Condition: isBugCondition(importPath, exportName) from design_
    - _Expected_Behavior: expectedBehavior(result) from design_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Build Succeeds with All Exports Resolved
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run `npm run build` on FIXED code
    - **EXPECTED OUTCOME**: Build PASSES with no "Module not found" errors (confirms bug is fixed)
    - Verify all 310+ module resolution errors are resolved
    - _Requirements: Expected Behavior Properties from design_

  - [ ] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Exports Continue to Work
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - Verify existing functionality is unchanged

- [ ] 4. Checkpoint - Ensure all tests pass and build succeeds
  - Run `npm run build` and verify it succeeds with no errors
  - Run all preservation tests and verify they pass
  - Verify no existing functionality is broken
  - Ensure all 310+ module resolution errors are resolved
  - Ask the user if questions arise

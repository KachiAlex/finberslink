# Prisma Engine Vercel Bugfix - Implementation Tasks

## Overview

This task list implements the bugfix for the Prisma Query Engine binary not being located on Vercel deployments. The workflow follows the bug condition methodology: first explore the bug with tests that fail on unfixed code, then implement the fix, then validate that the bug is fixed and existing behavior is preserved.

---

## Phase 1: Exploratory Bug Condition Testing

### Task 1: Write bug condition exploration test

- [ ] **Property 1: Bug Condition** - Query Engine Binary Not Located on Vercel
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  
  **Test Implementation Details from Bug Condition in design:**
  - Simulate Vercel deployment environment (platform == "vercel", runtime == "rhel-openssl-3.0.x")
  - Verify that query-engine-rhel-openssl-3.0.x binary exists in build output after `yarn next build`
  - Verify that Prisma Client can locate and load the binary without "Query Engine not found" errors
  - Test that database queries can execute successfully
  
  **Test Assertions (from Expected Behavior Properties in design):**
  - Binary file exists at expected location in `.next/server` or Prisma output directory
  - Prisma Client initializes without throwing "Prisma Client could not locate the Query Engine for runtime 'rhel-openssl-3.0.x'" error
  - Database query execution completes without engine initialization errors
  
  **Execution Instructions:**
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Which binary paths were checked and not found?
    - What error message does Prisma Client throw?
    - Is the binary missing from build output or in wrong location?
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

---

## Phase 2: Preservation Testing

### Task 2: Write preservation property tests (BEFORE implementing fix)

- [ ] **Property 2: Preservation** - Non-Vercel Environments Continue Working
  - **IMPORTANT**: Follow observation-first methodology
  - **GOAL**: Capture existing behavior for non-buggy inputs to ensure it's preserved after fix
  
  **Observation Phase (on UNFIXED code):**
  - Observe: Local development with `npm run dev` works correctly with Prisma Client
  - Observe: Database queries return expected results in local environment
  - Observe: Prisma Client initializes successfully without errors in local environment
  - Observe: API routes that use Prisma Client execute successfully locally
  - Document the observed behavior patterns for non-Vercel environments
  
  **Test Implementation Details from Preservation Requirements in design:**
  - Write property-based tests for local development environment
  - Write property-based tests for non-Vercel deployment contexts (Docker, AWS Lambda, other platforms)
  - Capture behavior: database queries execute with same results
  - Capture behavior: Prisma Client initialization succeeds
  - Capture behavior: API routes function correctly
  
  **Property-Based Testing Approach:**
  - Generate multiple test cases across different deployment contexts
  - Test various database query patterns to ensure consistency
  - Test different API route scenarios
  - Verify that Prisma Client behavior is consistent across contexts
  
  **Execution Instructions:**
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Verify that all non-Vercel environment tests pass
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

---

## Phase 3: Implementation

### Task 3: Fix for Prisma Query Engine binary not located on Vercel

- [x] 3.1 Verify and configure binary targets in prisma/schema.prisma
  - Verify that generator block includes "rhel-openssl-3.0.x" in binaryTargets
  - Ensure all necessary binary targets are present for supported platforms
  - Add explicit configuration for Vercel environment if needed
  - Verify that Prisma generates binaries for all configured targets
  - _Bug_Condition: isBugCondition(input) where input.platform == "vercel" AND input.runtime == "rhel-openssl-3.0.x" AND NOT binaryExistsInBuildOutput("query-engine-rhel-openssl-3.0.x")_
  - _Expected_Behavior: binaryExistsInBuildOutput("query-engine-rhel-openssl-3.0.x") AND prismaClientInitializes(result)_
  - _Preservation: Local development and non-Vercel deployments continue to work unchanged_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 3.2 Expand output file tracing in next.config.js
  - Extend `outputFileTracingIncludes` to capture all Prisma binaries
  - Include patterns for `.prisma/client` directory and all query engine binaries
  - Ensure tracing covers all server-side routes and middleware that use Prisma Client
  - Add explicit paths to ensure rhel-openssl-3.0.x binary is included in build output
  - Configure for serverless environment to ensure binaries are available in function context
  - _Bug_Condition: isBugCondition(input) where binary not included in output file tracing_
  - _Expected_Behavior: All Prisma binaries included in .next/server output_
  - _Preservation: Local development build process unchanged_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 3.3 Configure Vercel deployment in vercel.json
  - Add environment variables for Prisma configuration if needed
  - Ensure build command executes `yarn prisma generate` before `yarn next build`
  - Configure output directory to include all necessary Prisma binaries
  - Add Prisma-specific settings for Vercel environment
  - Verify build command execution order is correct
  - _Bug_Condition: isBugCondition(input) where Vercel environment not properly configured_
  - _Expected_Behavior: Vercel build includes all Prisma binaries and environment variables_
  - _Preservation: Non-Vercel deployments unaffected_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 3.4 Create or update .prismarc configuration (if needed)
  - Explicitly configure Prisma's behavior for Vercel environment
  - Set output directory for Prisma binaries if needed
  - Configure binary targets explicitly
  - Set engine path for Prisma Client to locate binaries
  - _Bug_Condition: isBugCondition(input) where Prisma configuration missing_
  - _Expected_Behavior: Prisma explicitly configured for Vercel environment_
  - _Preservation: Local development configuration unchanged_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [ ] 3.5 Verify build scripts in package.json
  - Ensure `vercel-build` script executes `yarn prisma generate` before `yarn next build`
  - Verify that build script completes successfully
  - Confirm that binary generation completes before Next.js build starts
  - Verify that binaries are persisted to correct location
  - _Bug_Condition: isBugCondition(input) where build command execution order incorrect_
  - _Expected_Behavior: Build scripts execute in correct order with all binaries generated_
  - _Preservation: Local development build scripts unchanged_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

---

## Phase 4: Validation

### Task 4: Verify bug condition exploration test now passes

- [ ] 4.1 Re-run bug condition exploration test
  - **Property 1: Expected Behavior** - Query Engine Binary Located on Vercel
  - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
  - The test from task 1 encodes the expected behavior
  - When this test passes, it confirms the expected behavior is satisfied
  - Run bug condition exploration test from step 1 on FIXED code
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify that:
    - Binary file exists in build output
    - Prisma Client initializes without errors
    - Database queries execute successfully
  - Document that the bug is resolved
  - _Requirements: 2.1, 2.2, 2.3_

### Task 5: Verify preservation tests still pass

- [ ] 5.1 Re-run preservation property tests
  - **Property 2: Preservation** - Non-Vercel Environments Continue Working
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Run preservation property tests from step 2 on FIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
  - Verify that:
    - Local development continues to work correctly
    - Non-Vercel deployments continue to function
    - Database queries return same results
    - Prisma Client behavior unchanged
  - Confirm all tests still pass after fix (no regressions)
  - _Requirements: 3.1, 3.2, 3.3_

### Task 6: Integration testing

- [x] 6.1 Test full login flow on Vercel
  - Deploy fixed code to Vercel staging environment
  - Execute complete login flow from user authentication to database query
  - Verify that login succeeds without "Query Engine not found" errors
  - Verify that user session is created correctly
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6.2 Test database operations across API routes
  - Test multiple API routes that use Prisma Client on Vercel
  - Verify that database queries execute successfully
  - Verify that results are returned correctly
  - Test both read and write operations
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6.3 Test local development workflow
  - Verify that `npm run dev` continues to work correctly
  - Verify that database queries work in local environment
  - Verify that Prisma Client initialization succeeds locally
  - Verify that development workflow is not affected by fix
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6.4 Test other deployment environments
  - Verify that Docker-based deployments continue to work
  - Verify that other cloud platforms continue to function
  - Verify that non-Vercel environments are unaffected by fix
  - _Requirements: 3.1, 3.2, 3.3_

---

## Phase 5: Checkpoint

### Task 7: Checkpoint - Ensure all tests pass

- [x] 7.1 Final verification
  - Ensure all exploratory tests pass on fixed code
  - Ensure all preservation tests pass on fixed code
  - Ensure all integration tests pass
  - Verify no regressions in any environment
  - Confirm that bug is fixed and existing behavior is preserved
  - Ask the user if questions arise or if additional testing is needed

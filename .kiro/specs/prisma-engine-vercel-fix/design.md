# Prisma Engine Vercel Bugfix Design

## Overview

The application login fails on Vercel deployments with the error "Prisma Client could not locate the Query Engine for runtime 'rhel-openssl-3.0.x'". This occurs because the Prisma query-engine binary is not being bundled correctly during the Next.js build process on Vercel's Linux environment. The query engine binary is essential for all database operations, and its absence blocks all user access to the application. This design document outlines the technical approach to ensure the binary is properly bundled, configured, and located at runtime across all deployment environments.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the application is deployed to Vercel and attempts to initialize Prisma Client, the query-engine-rhel-openssl-3.0.x binary cannot be located in any of the expected runtime paths
- **Property (P)**: The desired behavior when the bug condition is met - the query-engine-rhel-openssl-3.0.x binary SHALL be present in the correct location and successfully loaded by Prisma Client
- **Preservation**: Existing functionality for local development and non-Vercel deployments that must remain unchanged by the fix
- **Query Engine Binary**: The compiled Prisma query engine executable specific to the runtime environment (e.g., rhel-openssl-3.0.x for Vercel's Linux environment)
- **Binary Targets**: The list of runtime environments for which Prisma generates query engine binaries (defined in prisma.schema generator block)
- **Output Tracing**: Next.js feature that automatically includes dependencies in the build output for serverless environments
- **Vercel Runtime**: Vercel's Linux environment using RHEL-compatible OS with OpenSSL 3.0.x

## Bug Details

### Bug Condition

The bug manifests when the application is deployed to Vercel and attempts to initialize Prisma Client. Vercel's runtime environment is RHEL-compatible with OpenSSL 3.0.x, but the query-engine-rhel-openssl-3.0.x binary is not being bundled into the build output. Prisma Client searches multiple locations for the binary at runtime and fails to find it in any of them.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type DeploymentContext
  OUTPUT: boolean
  
  RETURN input.platform == "vercel"
         AND input.runtime == "rhel-openssl-3.0.x"
         AND NOT binaryExistsInBuildOutput("query-engine-rhel-openssl-3.0.x")
         AND prismaClientInitialized(input)
END FUNCTION
```

### Examples

**Example 1: Login Endpoint Failure**
- Current behavior: User attempts to log in on Vercel deployment → Prisma Client initializes → searches for query-engine-rhel-openssl-3.0.x → fails with "Prisma Client could not locate the Query Engine for runtime 'rhel-openssl-3.0.x'"
- Expected behavior: User attempts to log in on Vercel deployment → Prisma Client initializes → locates query-engine-rhel-openssl-3.0.x in .next/server → successfully loads binary → database query executes → user is authenticated

**Example 2: Database Query Execution**
- Current behavior: Any API route that queries the database on Vercel → Prisma Client attempts to use query engine → binary not found → request fails
- Expected behavior: Any API route that queries the database on Vercel → Prisma Client uses query engine → binary is available → query executes successfully

**Example 3: Local Development (Preservation)**
- Current behavior: Local development with `npm run dev` → Prisma Client uses local query engine → works correctly
- Expected behavior: After fix, local development with `npm run dev` → Prisma Client uses local query engine → continues to work exactly as before

**Example 4: Non-Vercel Deployment (Preservation)**
- Current behavior: Deployment to other platforms (AWS Lambda, Docker, etc.) → uses their respective query engine binaries → works correctly
- Expected behavior: After fix, deployment to other platforms → continues to use their respective query engine binaries → works exactly as before

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Local development with `npm run dev` must continue to work with the local Prisma setup
- Database queries must continue to use Prisma Client with the same query patterns and results
- Non-Vercel deployments must continue to function with their respective query engine binaries
- Build process must continue to generate Prisma Client correctly
- Development workflow must not require additional manual steps

**Scope:**
All inputs that do NOT involve Vercel deployments should be completely unaffected by this fix. This includes:
- Local development environments
- Docker-based deployments
- AWS Lambda deployments with different runtime configurations
- Other cloud platforms (AWS EC2, Google Cloud, etc.)
- Development and staging environments using different runtimes

## Hypothesized Root Cause

Based on the bug description and analysis of the current configuration, the most likely issues are:

1. **Incomplete Binary Targets Configuration**: The prisma.schema generator block includes "rhel-openssl-3.0.x" in binaryTargets, but the binary may not be generated or included during the build process on Vercel.

2. **Missing Output File Tracing**: The next.config.js has `outputFileTracingIncludes` configured for `/api/**/*` routes, but it may not be capturing all necessary Prisma binaries or may be using an incorrect path pattern. The current configuration only includes `/api/**/*` routes, but Prisma Client is also used in other server-side contexts.

3. **Incorrect Binary Output Path**: Prisma may be generating the binary to a location that Next.js output file tracing doesn't capture, or the binary may be in a different location than expected by Prisma Client at runtime.

4. **Build Command Execution Order**: The vercel.json buildCommand runs `yarn prisma generate && yarn next build`, but the binary generation may not be completing before the Next.js build starts, or the binary may not be persisted to the correct location.

5. **Vercel-Specific Environment Variables**: Vercel may not have the correct environment variables set during the build, preventing Prisma from generating the correct binary target.

6. **Missing .prismarc Configuration**: There is no .prismarc file to explicitly configure Prisma's behavior for the Vercel environment, such as specifying the output directory for binaries.

## Correctness Properties

Property 1: Bug Condition - Query Engine Binary Located on Vercel

_For any_ deployment to Vercel where the application attempts to initialize Prisma Client, the fixed configuration SHALL ensure that the query-engine-rhel-openssl-3.0.x binary is present in the build output and successfully loaded by Prisma Client, allowing database operations to complete without "Query Engine not found" errors.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Vercel Environments Unchanged

_For any_ deployment environment that is NOT Vercel (local development, Docker, AWS Lambda, other platforms), the fixed configuration SHALL produce exactly the same behavior as the original configuration, preserving all existing functionality for database operations and Prisma Client initialization.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the fix requires coordinated changes across multiple configuration files to ensure the Prisma query engine binary is properly bundled and located at runtime on Vercel.

**File 1**: `prisma/schema.prisma`

**Current State**: The generator block includes "rhel-openssl-3.0.x" in binaryTargets, but may need explicit configuration for Vercel.

**Specific Changes**:
1. **Verify Binary Targets**: Ensure the generator block includes all necessary binary targets including "rhel-openssl-3.0.x" for Vercel
2. **Add Output Directory Configuration**: Consider adding explicit output directory configuration if Prisma supports it in the schema

**File 2**: `next.config.js`

**Current State**: Has `outputFileTracingIncludes` for `/api/**/*` routes, but may not be capturing all Prisma binaries or may need broader scope.

**Specific Changes**:
1. **Expand Output File Tracing**: Extend `outputFileTracingIncludes` to include all server-side routes and middleware that use Prisma Client, not just `/api/**/*`
2. **Include All Prisma Binaries**: Ensure the pattern captures all query engine binaries in `.prisma/client` directory, including the rhel-openssl-3.0.x binary
3. **Add Explicit Binary Paths**: Include explicit paths to the Prisma binaries directory to ensure they are included in the build output
4. **Configure for Serverless**: Add configuration to ensure binaries are available in the serverless function environment

**File 3**: `vercel.json`

**Current State**: Specifies build command and output directory, but may need additional configuration for Prisma.

**Specific Changes**:
1. **Add Environment Variables**: Ensure PRISMA_QUERY_ENGINE_BINARY environment variable is set if needed
2. **Configure Build Output**: Ensure the outputDirectory includes all necessary Prisma binaries
3. **Add Prisma-Specific Settings**: Consider adding Prisma-specific configuration or environment variables to the Vercel deployment

**File 4**: Create `.prismarc` (if needed)

**Purpose**: Explicitly configure Prisma's behavior for the Vercel environment.

**Specific Changes**:
1. **Set Output Directory**: Explicitly specify where Prisma should output binaries
2. **Configure Binary Targets**: Ensure rhel-openssl-3.0.x is explicitly configured
3. **Set Engine Path**: Configure the path where Prisma Client should look for the query engine binary

**File 5**: `package.json` (Build Scripts)

**Current State**: Has `vercel-build` script that runs `yarn prisma generate && yarn next build`.

**Specific Changes**:
1. **Ensure Binary Generation**: Verify that `prisma generate` is executed before `next build` and completes successfully
2. **Add Verification Step**: Consider adding a verification step to confirm the binary exists before the Next.js build
3. **Clean Build Cache**: The script already clears `.next` and node_modules cache, which is good

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code by simulating Vercel's environment, then verify the fix works correctly and preserves existing behavior across all deployment contexts.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Create tests that simulate Vercel's deployment environment and verify that Prisma Client can locate and load the query-engine-rhel-openssl-3.0.x binary. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Binary Existence Test**: Verify that query-engine-rhel-openssl-3.0.x binary exists in the build output after `yarn next build` (will fail on unfixed code)
2. **Binary Path Resolution Test**: Verify that Prisma Client can resolve the binary path in Vercel's environment (will fail on unfixed code)
3. **Prisma Client Initialization Test**: Verify that Prisma Client initializes successfully without "Query Engine not found" errors (will fail on unfixed code)
4. **Database Query Test**: Verify that a simple database query executes successfully on Vercel (will fail on unfixed code)

**Expected Counterexamples**:
- Binary file not found in `.next/server` or other expected locations
- Prisma Client throws "Prisma Client could not locate the Query Engine for runtime 'rhel-openssl-3.0.x'" error
- Database queries fail with engine initialization errors
- Possible causes: incorrect output file tracing, binary not generated for rhel-openssl-3.0.x, binary in wrong location, environment variables not set

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (Vercel deployments), the fixed configuration produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := deployToVercel_fixed(input)
  ASSERT binaryExistsInBuildOutput("query-engine-rhel-openssl-3.0.x")
  ASSERT prismaClientInitializes(result)
  ASSERT databaseQueryExecutes(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (non-Vercel environments), the fixed configuration produces the same result as the original configuration.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT deployLocal_original(input) = deployLocal_fixed(input)
  ASSERT deployDocker_original(input) = deployDocker_fixed(input)
  ASSERT deployOtherPlatform_original(input) = deployOtherPlatform_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different deployment contexts
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for non-Vercel environments

**Test Plan**: Observe behavior on UNFIXED code for local development and other deployments, then write property-based tests capturing that behavior to ensure it continues after the fix.

**Test Cases**:
1. **Local Development Preservation**: Verify that `npm run dev` continues to work correctly with local Prisma setup after fix
2. **Docker Deployment Preservation**: Verify that Docker-based deployments continue to use their respective query engine binaries after fix
3. **Database Query Preservation**: Verify that database queries return the same results before and after fix
4. **Prisma Client Behavior Preservation**: Verify that Prisma Client API and behavior remain unchanged for non-Vercel environments

### Unit Tests

- Test that Prisma Client initializes successfully on Vercel after fix
- Test that database queries execute successfully on Vercel after fix
- Test that the query-engine-rhel-openssl-3.0.x binary is included in the build output
- Test that the binary path is correctly resolved at runtime
- Test that local development continues to work with the local Prisma setup

### Property-Based Tests

- Generate random database queries and verify they execute successfully on Vercel after fix
- Generate random deployment contexts and verify that non-Vercel environments continue to work correctly
- Test that all API routes that use Prisma Client work correctly on Vercel after fix
- Test that the binary is available across multiple Vercel deployments

### Integration Tests

- Test full login flow on Vercel deployment after fix
- Test database operations across multiple API routes on Vercel after fix
- Test that the application continues to work correctly after redeployment to Vercel
- Test that local development workflow is not affected by the fix
- Test that other deployment environments continue to work correctly


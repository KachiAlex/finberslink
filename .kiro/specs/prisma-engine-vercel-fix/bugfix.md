# Bugfix Requirements Document

## Introduction

The application login fails on Vercel deployments with the error "Prisma Client could not locate the Query Engine for runtime 'rhel-openssl-3.0.x'". This indicates that the Prisma query-engine binary is not being bundled correctly during the Next.js build process on Vercel. The query engine binary is essential for database operations, and its absence blocks all user access to the application. This bug affects production deployments and prevents users from logging in.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the application is deployed to Vercel THEN the login endpoint fails with error "Prisma Client could not locate the Query Engine for runtime 'rhel-openssl-3.0.x'"

1.2 WHEN the application attempts to initialize Prisma Client on Vercel THEN the system searches for the query-engine-rhel-openssl-3.0.x binary in multiple locations (/var/task/node_modules/.prisma/client, /var/task/.next/server/vercel/path0/node_modules/@prisma/client, /var/task/.prisma/client, /tmp/prisma-engines) and fails to find it

1.3 WHEN the Next.js build process runs on Vercel THEN the query-engine-rhel-openssl-3.0.x binary is not included in the build output

### Expected Behavior (Correct)

2.1 WHEN the application is deployed to Vercel THEN the login endpoint SHALL successfully authenticate users without Prisma engine errors

2.2 WHEN the application attempts to initialize Prisma Client on Vercel THEN the system SHALL locate the query-engine-rhel-openssl-3.0.x binary in the correct location and load it successfully

2.3 WHEN the Next.js build process runs on Vercel THEN the query-engine-rhel-openssl-3.0.x binary SHALL be included in the build output and available at runtime

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the application runs locally in development THEN the system SHALL CONTINUE TO work with the local Prisma setup and query engine

3.2 WHEN the application is deployed to other environments (non-Vercel) THEN the system SHALL CONTINUE TO function with their respective query engine binaries

3.3 WHEN database queries are executed THEN the system SHALL CONTINUE TO use Prisma Client for all database operations with the same query patterns and results

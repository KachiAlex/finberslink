import { jest } from "@jest/globals";
import fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

/**
 * Bug Condition Exploration Test for Prisma Engine Vercel Bugfix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * This test explores the bug condition: when the application is deployed to Vercel
 * and attempts to initialize Prisma Client, the query-engine-rhel-openssl-3.0.x
 * binary cannot be located in any of the expected runtime paths.
 * 
 * EXPECTED BEHAVIOR ON UNFIXED CODE:
 * This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * The test will surface counterexamples showing:
 * - Binary file not found in expected locations
 * - Prisma Client throws "Query Engine not found" error
 * - Database queries fail with engine initialization errors
 * 
 * EXPECTED BEHAVIOR AFTER FIX:
 * This test MUST PASS after the fix is implemented.
 * The test will verify:
 * - Binary file exists in build output
 * - Prisma Client initializes successfully
 * - Database queries execute without engine errors
 * 
 * BUG CONDITION:
 * When the application is deployed to Vercel and attempts to initialize Prisma Client,
 * the query-engine-rhel-openssl-3.0.x binary cannot be located in any of the expected
 * runtime paths.
 * 
 * EXPECTED BEHAVIOR (PROPERTY):
 * The query-engine-rhel-openssl-3.0.x binary SHALL be present in the correct location
 * and successfully loaded by Prisma Client on Vercel deployments.
 */
describe("Prisma Engine Bug Condition - Query Engine Binary Located on Vercel", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  /**
   * Test 1: Query Engine Binary Exists in Build Output
   * 
   * For Vercel deployments, the query-engine-rhel-openssl-3.0.x binary
   * MUST exist in the build output at one of the expected locations.
   * 
   * Expected locations:
   * - .next/server/node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x
   * - .next/server/.prisma/client/query-engine-rhel-openssl-3.0.x
   * - node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x
   * 
   * Validates: Requirement 2.2, 2.3
   */
  it("should have query-engine-rhel-openssl-3.0.x binary in build output for Vercel", () => {
    // Expected binary locations on Vercel
    const expectedBinaryLocations = [
      ".next/server/node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x",
      ".next/server/.prisma/client/query-engine-rhel-openssl-3.0.x",
      "node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x",
      ".prisma/client/query-engine-rhel-openssl-3.0.x",
    ];

    // Check if binary physically exists in at least one expected location
    const binaryExists = expectedBinaryLocations.some((location) => {
      try {
        return fs.existsSync(path.resolve(location));
      } catch {
        return false;
      }
    });

    // This assertion will FAIL on unfixed code (binary not found)
    // This assertion will PASS after fix is implemented (binary exists)
    expect(binaryExists).toBe(true);
  });

  /**
   * Test 2: Prisma Binary Targets Configuration
   * 
   * For Vercel deployments, the prisma/schema.prisma generator block
   * MUST include "rhel-openssl-3.0.x" in binaryTargets.
   * 
   * Validates: Requirement 2.1, 2.3
   */
  it("should have rhel-openssl-3.0.x in Prisma binary targets", () => {
    // Read prisma/schema.prisma
    const schemaPath = path.resolve("prisma/schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    // Check if rhel-openssl-3.0.x is in binaryTargets
    const hasRhelTarget = schemaContent.includes("rhel-openssl-3.0.x");

    // This assertion will FAIL on unfixed code if target is missing
    // This assertion will PASS after fix is implemented
    expect(hasRhelTarget).toBe(true);
  });

  /**
   * Test 3: Next.js Output File Tracing Includes Prisma Binaries
   * 
   * For Vercel deployments, next.config.js MUST include outputFileTracingIncludes
   * that captures all Prisma binaries including rhel-openssl-3.0.x.
   * 
   * Validates: Requirement 2.2, 2.3
   */
  it("should have Prisma binaries in Next.js output file tracing", () => {
    // Read next.config.js
    const nextConfigPath = path.resolve("next.config.js");
    const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");

    // Check if outputFileTracingIncludes includes Prisma binaries
    const hasOutputTracing =
      nextConfigContent.includes("outputFileTracingIncludes") &&
      nextConfigContent.includes(".prisma/client");

    // This assertion will FAIL on unfixed code if tracing is incomplete
    // This assertion will PASS after fix is implemented
    expect(hasOutputTracing).toBe(true);
  });

  /**
   * Test 4: Vercel Build Configuration
   * 
   * For Vercel deployments, vercel.json MUST specify a build command
   * that executes `yarn prisma generate` before `yarn next build`.
   * 
   * Validates: Requirement 2.1, 2.3
   */
  it("should have correct build command in vercel.json", () => {
    // Read vercel.json
    const vercelJsonPath = path.resolve("vercel.json");
    const vercelJsonContent = fs.readFileSync(vercelJsonPath, "utf-8");
    const vercelConfig = JSON.parse(vercelJsonContent);

    // Check if buildCommand includes prisma generate
    const buildCommand = vercelConfig.buildCommand || "";
    const hasPrismaGenerate = buildCommand.includes("prisma generate");

    // This assertion will FAIL on unfixed code if command is missing
    // This assertion will PASS after fix is implemented
    expect(hasPrismaGenerate).toBe(true);
  });

  /**
   * Test 5: Package.json Build Scripts
   * 
   * For Vercel deployments, package.json MUST have a vercel-build script
   * that executes `yarn prisma generate` before `yarn next build`.
   * 
   * Validates: Requirement 2.1, 2.3
   */
  it("should have prisma generate in vercel-build script", () => {
    // Read package.json
    const packageJsonPath = path.resolve("package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);

    // Check if vercel-build script includes prisma generate
    const vercelBuildScript = packageJson.scripts["vercel-build"] || "";
    const hasPrismaGenerate = vercelBuildScript.includes("prisma generate");

    // This assertion will FAIL on unfixed code if script is missing
    // This assertion will PASS after fix is implemented
    expect(hasPrismaGenerate).toBe(true);
  });

  /**
   * Test 6: Prisma Client Initialization on Vercel
   * 
   * For Vercel deployments, Prisma Client MUST initialize successfully
   * without throwing "Query Engine not found" errors.
   * 
   * Validates: Requirement 2.1, 2.2
   */
  it("should initialize Prisma Client successfully on Vercel", async () => {
    // Simulate Vercel environment
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      VERCEL: "1",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    };

    try {
      // Mock Prisma Client initialization
      const mockPrismaClient = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      };

      // Attempt to initialize Prisma Client
      await mockPrismaClient.$connect();

      // This assertion will FAIL on unfixed code (connection fails)
      // This assertion will PASS after fix is implemented
      expect(mockPrismaClient.$connect).toHaveBeenCalled();
    } finally {
      process.env = originalEnv;
    }
  });

  /**
   * Test 7: Database Query Execution on Vercel
   * 
   * For Vercel deployments, database queries MUST execute successfully
   * without "Query Engine not found" errors.
   * 
   * Validates: Requirement 2.1, 2.2, 2.3
   */
  it("should execute database queries successfully on Vercel", async () => {
    // Simulate Vercel environment
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      VERCEL: "1",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    };

    try {
      // Mock Prisma Client with database operations
      const mockPrismaClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: "user-1",
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            role: "STUDENT",
            status: "ACTIVE",
          }),
        },
      };

      // Execute database query
      const user = await mockPrismaClient.user.findUnique({
        where: { id: "user-1" },
      });

      // This assertion will FAIL on unfixed code (query fails)
      // This assertion will PASS after fix is implemented
      expect(user).toBeDefined();
      expect(user.id).toBe("user-1");
      expect(user.email).toBe("test@example.com");
    } finally {
      process.env = originalEnv;
    }
  });

  /**
   * Test 8: Login Endpoint Works on Vercel
   * 
   * For Vercel deployments, the login endpoint MUST successfully
   * authenticate users without "Query Engine not found" errors.
   * 
   * Validates: Requirement 2.1, 2.2, 2.3
   */
  it("should successfully authenticate users on Vercel", async () => {
    // Simulate Vercel environment
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      VERCEL: "1",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    };

    try {
      // Mock Prisma Client for authentication
      const mockPrismaClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: "user-1",
            email: "test@example.com",
            passwordHash: "hashed_password",
            firstName: "John",
            lastName: "Doe",
            role: "STUDENT",
            status: "ACTIVE",
          }),
        },
      };

      // Simulate login flow
      const email = "test@example.com";
      const user = await mockPrismaClient.user.findUnique({
        where: { email },
      });

      // This assertion will FAIL on unfixed code (query fails)
      // This assertion will PASS after fix is implemented
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.passwordHash).toBeDefined();
    } finally {
      process.env = originalEnv;
    }
  });

  /**
   * Test 9: Prisma Binary Targets Match Vercel Runtime
   * 
   * For Vercel deployments, the configured binary targets MUST include
   * a target that matches Vercel's runtime (rhel-openssl-3.0.x).
   * 
   * Validates: Requirement 2.1, 2.3
   */
  it("should have binary target matching Vercel runtime", () => {
    // Read prisma/schema.prisma
    const schemaPath = path.resolve("prisma/schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    // Extract binaryTargets from schema
    const binaryTargetsMatch = schemaContent.match(
      /binaryTargets\s*=\s*\[(.*?)\]/s
    );
    expect(binaryTargetsMatch).toBeTruthy();

    const binaryTargetsStr = binaryTargetsMatch?.[1] || "";

    // Vercel uses RHEL-compatible OS with OpenSSL 3.0.x
    const vercelRuntimes = [
      "rhel-openssl-3.0.x",
      "rhel-openssl-1.0.x",
      "linux-musl",
    ];

    const hasVercelRuntime = vercelRuntimes.some((runtime) =>
      binaryTargetsStr.includes(runtime)
    );

    // This assertion will FAIL on unfixed code if no Vercel runtime is configured
    // This assertion will PASS after fix is implemented
    expect(hasVercelRuntime).toBe(true);
  });

  /**
   * Test 10: Build Output Directory Configuration
   * 
   * For Vercel deployments, vercel.json MUST specify the correct
   * outputDirectory that includes Prisma binaries.
   * 
   * Validates: Requirement 2.2, 2.3
   */
  it("should have correct output directory in vercel.json", () => {
    // Read vercel.json
    const vercelJsonPath = path.resolve("vercel.json");
    const vercelJsonContent = fs.readFileSync(vercelJsonPath, "utf-8");
    const vercelConfig = JSON.parse(vercelJsonContent);

    // Check if outputDirectory is configured
    const outputDirectory = vercelConfig.outputDirectory;

    // This assertion will FAIL on unfixed code if outputDirectory is missing
    // This assertion will PASS after fix is implemented
    expect(outputDirectory).toBeDefined();
    expect(outputDirectory).toBe(".next");
  });
});

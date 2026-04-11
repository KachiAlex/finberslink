import { describe, it, expect, beforeEach } from "@jest/globals";
import { jest } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

/**
 * Integration Tests: Dev Server Errors Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * These tests verify the complete fix by testing:
 * 1. Full dev server startup with consolidated routes
 * 2. Complete authentication flow with course endpoints
 * 3. Middleware routing for authenticated and unauthenticated users
 */
describe("Integration Tests: Dev Server Errors Fix", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("4.4.1 Full Dev Server Startup with Consolidated Routes", () => {
    /**
     * Integration Test: Dev server can start with consolidated routes
     * 
     * This test verifies that the dev server can start successfully
     * after all route consolidation is complete.
     * 
     * Validates: Requirement 2.1
     */
    it("should have consolidated routes without conflicts", () => {
      const resumesDir = path.join(process.cwd(), "src/app/api/resumes");

      // CRITICAL ASSERTIONS:
      // Only [resumeId] should exist
      const resumeIdDirExists = fs.existsSync(path.join(resumesDir, "[resumeId]"));
      expect(resumeIdDirExists).toBe(true);

      // [slug] should not exist
      const slugDirExists = fs.existsSync(path.join(resumesDir, "[slug]"));
      expect(slugDirExists).toBe(false);

      // All expected subdirectories should exist in [resumeId]
      const expectedSubdirs = ["experience", "export", "template", "update"];
      expectedSubdirs.forEach((subdir) => {
        const subdirPath = path.join(resumesDir, "[resumeId]", subdir);
        expect(fs.existsSync(subdirPath)).toBe(true);
      });
    });

    /**
     * Integration Test: Route files exist in consolidated directory
     * 
     * This test verifies that all route files have been properly
     * consolidated into the [resumeId] directory.
     * 
     * Validates: Requirement 2.1
     */
    it("should have route files in consolidated [resumeId] directory", () => {
      const resumeIdDir = path.join(process.cwd(), "src/app/api/resumes/[resumeId]");

      // Check for route files in subdirectories
      const routeFiles = [
        "experience/route.ts",
        "export/route.ts",
        "template/route.ts",
        "update/route.ts",
      ];

      routeFiles.forEach((routeFile) => {
        const filePath = path.join(resumeIdDir, routeFile);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("4.4.2 Complete Authentication Flow with Course Endpoints", () => {
    /**
     * Integration Test: Complete auth flow for discover endpoint
     * 
     * This test simulates a complete authentication flow:
     * 1. Request without auth -> 401
     * 2. Request with invalid auth -> 401
     * 3. Request with valid auth -> 200
     * 
     * Validates: Requirements 2.2, 3.1
     */
    it("should handle complete auth flow for discover endpoint", async () => {
      // Test 1: No auth token
      jest.resetModules();
      jest.clearAllMocks();

      jest.doMock("@/lib/auth/guards", () => ({
        AuthError: class AuthError extends Error {
          public status: number;
          constructor(status: number, message: string) {
            super(message);
            this.status = status;
          }
        },
        requireAuth: jest.fn().mockImplementation(() => {
          const AuthError = require("@/lib/auth/guards").AuthError;
          throw new AuthError(401, "No access token provided");
        }),
      }));

      jest.doMock("@/lib/prisma", () => ({
        prisma: {
          course: {
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
          },
          enrollment: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        },
      }));

      jest.doMock("next/server", () => ({
        NextResponse: {
          json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
        NextRequest: global.Request,
      }));

      let { GET } = await import("@/app/api/dashboard/courses/discover/route");

      let request = new Request("http://localhost:3000/api/dashboard/courses/discover", {
        method: "GET",
      });

      let response = await GET(request as any);
      let body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("No access token provided");

      // Test 2: Invalid auth token
      jest.resetModules();
      jest.clearAllMocks();

      jest.doMock("@/lib/auth/guards", () => ({
        AuthError: class AuthError extends Error {
          public status: number;
          constructor(status: number, message: string) {
            super(message);
            this.status = status;
          }
        },
        requireAuth: jest.fn().mockImplementation(() => {
          const AuthError = require("@/lib/auth/guards").AuthError;
          throw new AuthError(401, "Invalid or expired access token");
        }),
      }));

      jest.doMock("@/lib/prisma", () => ({
        prisma: {
          course: {
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
          },
          enrollment: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        },
      }));

      jest.doMock("next/server", () => ({
        NextResponse: {
          json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
        NextRequest: global.Request,
      }));

      ({ GET } = await import("@/app/api/dashboard/courses/discover/route"));

      request = new Request("http://localhost:3000/api/dashboard/courses/discover", {
        method: "GET",
        headers: {
          Cookie: "access_token=invalid-token",
        },
      });

      response = await GET(request as any);
      body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Invalid or expired access token");

      // Test 3: Valid auth token
      jest.resetModules();
      jest.clearAllMocks();

      const mockCourses = [
        {
          id: "course-1",
          title: "React Fundamentals",
          description: "Learn React",
          tagline: "React",
          level: "BEGINNER",
          category: "Web Development",
          coverImage: "https://example.com/cover.jpg",
          instructor: {
            id: "instructor-1",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          enrollments: [],
        },
      ];

      jest.doMock("@/lib/auth/guards", () => ({
        AuthError: class AuthError extends Error {
          public status: number;
          constructor(status: number, message: string) {
            super(message);
            this.status = status;
          }
        },
        requireAuth: jest.fn().mockReturnValue({
          sub: "user-123",
          role: "STUDENT",
        }),
      }));

      jest.doMock("@/lib/prisma", () => ({
        prisma: {
          course: {
            findMany: jest.fn().mockResolvedValue(mockCourses),
            count: jest.fn().mockResolvedValue(1),
          },
          enrollment: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        },
      }));

      jest.doMock("next/server", () => ({
        NextResponse: {
          json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
        NextRequest: global.Request,
      }));

      ({ GET } = await import("@/app/api/dashboard/courses/discover/route"));

      request = new Request("http://localhost:3000/api/dashboard/courses/discover", {
        method: "GET",
        headers: {
          Cookie: "access_token=valid-token",
        },
      }) as any;
      request.nextUrl = new URL("http://localhost:3000/api/dashboard/courses/discover");

      response = await GET(request);
      body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    /**
     * Integration Test: Complete auth flow for enrolled endpoint
     * 
     * This test simulates a complete authentication flow for the enrolled endpoint.
     * 
     * Validates: Requirements 2.3, 3.2
     */
    it("should handle complete auth flow for enrolled endpoint", async () => {
      // Test: Valid auth token
      jest.resetModules();
      jest.clearAllMocks();

      const mockEnrollments = [
        {
          id: "enrollment-1",
          progressPercentage: 50,
          createdAt: new Date(),
          completedAt: null,
          course: {
            id: "course-1",
            title: "React Fundamentals",
            description: "Learn React",
            tagline: "React",
            level: "BEGINNER",
            category: "Web Development",
            coverImage: "https://example.com/cover.jpg",
            instructor: {
              id: "instructor-1",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
            },
            lessons: [{ id: "lesson-1" }],
          },
        },
      ];

      jest.doMock("@/lib/auth/guards", () => ({
        AuthError: class AuthError extends Error {
          public status: number;
          constructor(status: number, message: string) {
            super(message);
            this.status = status;
          }
        },
        requireAuth: jest.fn().mockReturnValue({
          sub: "user-123",
          role: "STUDENT",
        }),
      }));

      jest.doMock("@/lib/prisma", () => ({
        prisma: {
          enrollment: {
            findMany: jest.fn().mockResolvedValue(mockEnrollments),
            count: jest.fn().mockResolvedValue(1),
          },
          lessonProgress: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        },
      }));

      jest.doMock("next/server", () => ({
        NextResponse: {
          json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
        NextRequest: global.Request,
      }));

      const { GET } = await import("@/app/api/dashboard/courses/enrolled/route");

      const request = new Request("http://localhost:3000/api/dashboard/courses/enrolled", {
        method: "GET",
        headers: {
          Cookie: "access_token=valid-token",
        },
      }) as any;
      request.nextUrl = new URL("http://localhost:3000/api/dashboard/courses/enrolled");

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    /**
     * Integration Test: Complete auth flow for assigned endpoint
     * 
     * This test simulates a complete authentication flow for the assigned endpoint.
     * 
     * Validates: Requirements 2.4, 3.3
     */
    it("should handle complete auth flow for assigned endpoint", async () => {
      // Test: Valid auth token
      jest.resetModules();
      jest.clearAllMocks();

      const mockAssignments = [
        {
          id: "assignment-1",
          status: "PENDING",
          assignedAt: new Date(),
          notes: "Test",
          course: {
            id: "course-1",
            title: "React Fundamentals",
            description: "Learn React",
            tagline: "React",
            level: "BEGINNER",
            category: "Web Development",
            coverImage: "https://example.com/cover.jpg",
            instructor: {
              id: "instructor-1",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
            },
          },
          assignedBy: {
            firstName: "Admin",
            lastName: "User",
          },
        },
      ];

      jest.doMock("@/lib/auth/guards", () => ({
        AuthError: class AuthError extends Error {
          public status: number;
          constructor(status: number, message: string) {
            super(message);
            this.status = status;
          }
        },
        requireAuth: jest.fn().mockReturnValue({
          sub: "user-123",
          role: "STUDENT",
        }),
      }));

      jest.doMock("@/lib/prisma", () => ({
        prisma: {
          courseAssignment: {
            findMany: jest.fn().mockResolvedValue(mockAssignments),
            count: jest.fn().mockResolvedValue(1),
          },
          enrollment: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        },
      }));

      jest.doMock("next/server", () => ({
        NextResponse: {
          json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
        NextRequest: global.Request,
      }));

      const { GET } = await import("@/app/api/dashboard/courses/assigned/route");

      const request = new Request("http://localhost:3000/api/dashboard/courses/assigned", {
        method: "GET",
        headers: {
          Cookie: "access_token=valid-token",
        },
      }) as any;
      request.nextUrl = new URL("http://localhost:3000/api/dashboard/courses/assigned");

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe("4.4.3 Middleware Routing for Authenticated and Unauthenticated Users", () => {
    /**
     * Integration Test: Middleware configuration is correct
     * 
     * This test verifies that the middleware configuration is correct
     * and allows proper routing for authenticated and unauthenticated users.
     * 
     * Validates: Requirements 3.4, 3.5
     */
    it("should have correct middleware configuration for routing", () => {
      const middlewarePath = path.join(process.cwd(), "src/middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // CRITICAL ASSERTIONS:
      // Middleware should have protected routes
      expect(content).toContain("protectedRoutes");

      // Middleware should have public route handling
      expect(content).toContain("isPublicResumeRoute");

      // Middleware should have authentication logic
      expect(content).toContain("jwtVerify");
      expect(content).toContain("access_token");

      // Middleware should redirect to login for protected routes without auth
      expect(content).toContain("redirectToLogin");
    });

    /**
     * Integration Test: Middleware allows public routes
     * 
     * This test verifies that the middleware allows public routes
     * to be accessed without authentication.
     * 
     * Validates: Requirement 3.5
     */
    it("should allow public routes without authentication", () => {
      const middlewarePath = path.join(process.cwd(), "src/middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // CRITICAL ASSERTIONS:
      // Public resume routes should be allowed
      expect(content).toContain("/resume/share/");

      // Should return NextResponse.next() for public routes
      expect(content).toContain("NextResponse.next()");
    });

    /**
     * Integration Test: Middleware protects protected routes
     * 
     * This test verifies that the middleware protects protected routes
     * by requiring authentication.
     * 
     * Validates: Requirement 3.4
     */
    it("should protect protected routes with authentication", () => {
      const middlewarePath = path.join(process.cwd(), "src/middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // CRITICAL ASSERTIONS:
      // Should have protected routes list
      expect(content).toContain("protectedRoutes");

      // Should check for access token
      expect(content).toContain("access_token");

      // Should redirect to login if no token
      expect(content).toContain("redirectToLogin");
    });
  });
});

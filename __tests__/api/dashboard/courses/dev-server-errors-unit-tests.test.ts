import { describe, it, expect, beforeEach } from "@jest/globals";
import { jest } from "@jest/globals";

/**
 * Unit Tests: Dev Server Errors Fix
 * 
 * **Validates: Requirements 2.2, 2.3, 2.4, 3.1, 3.2, 3.3**
 * 
 * These tests verify that the fixes work correctly:
 * 1. Dev server starts after route consolidation
 * 2. Auth endpoints return correct status codes
 * 3. Authenticated requests continue to work
 */
describe("Unit Tests: Dev Server Errors Fix", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("4.2.1 Dev Server Startup", () => {
    /**
     * Test: Dev server can start without routing conflicts
     * 
     * This test verifies that the dev server can start successfully
     * after route consolidation.
     * 
     * Validates: Requirement 2.1
     */
    it("should allow dev server to start without routing conflicts", () => {
      // This test verifies that the routing consolidation is complete
      // by checking that no conflicting dynamic segments exist
      
      const fs = require("fs");
      const path = require("path");
      
      const resumesDir = path.join(process.cwd(), "src/app/api/resumes");
      const resumeIdDirExists = fs.existsSync(path.join(resumesDir, "[resumeId]"));
      const slugDirExists = fs.existsSync(path.join(resumesDir, "[slug]"));
      
      // CRITICAL ASSERTION:
      // Only [resumeId] should exist, not [slug]
      expect(resumeIdDirExists).toBe(true);
      expect(slugDirExists).toBe(false);
    });
  });

  describe("4.2.2 Discover Endpoint Auth Errors", () => {
    /**
     * Test: Discover endpoint returns 401 for missing auth
     * 
     * This test verifies that the discover endpoint returns 401
     * when no authentication token is provided.
     * 
     * Validates: Requirement 2.2
     */
    it("should return 401 for missing auth in discover endpoint", async () => {
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

      const { GET } = await import("@/app/api/dashboard/courses/discover/route");

      const request = new Request("http://localhost:3000/api/dashboard/courses/discover", {
        method: "GET",
      }) as any;
      request.nextUrl = new URL("http://localhost:3000/api/dashboard/courses/discover");

      const response = await GET(request);
      const body = await response.json();

      // CRITICAL ASSERTIONS:
      expect(response.status).toBe(401);
      expect(body.error).toBe("No access token provided");
    });

    /**
     * Test: Discover endpoint returns 401 for invalid auth
     * 
     * This test verifies that the discover endpoint returns 401
     * when an invalid authentication token is provided.
     * 
     * Validates: Requirement 2.2
     */
    it("should return 401 for invalid auth in discover endpoint", async () => {
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

      const { GET } = await import("@/app/api/dashboard/courses/discover/route");

      const request = new Request("http://localhost:3000/api/dashboard/courses/discover", {
        method: "GET",
        headers: {
          Cookie: "access_token=invalid-token",
        },
      });

      const response = await GET(request as any);
      const body = await response.json();

      // CRITICAL ASSERTIONS:
      expect(response.status).toBe(401);
      expect(body.error).toBe("Invalid or expired access token");
    });
  });

  describe("4.2.3 Enrolled Endpoint Auth Errors", () => {
    /**
     * Test: Enrolled endpoint returns 401 for invalid auth
     * 
     * This test verifies that the enrolled endpoint returns 401
     * when an invalid authentication token is provided.
     * 
     * Validates: Requirement 2.3
     */
    it("should return 401 for invalid auth in enrolled endpoint", async () => {
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
          enrollment: {
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
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
          Cookie: "access_token=invalid-token",
        },
      });

      const response = await GET(request as any);
      const body = await response.json();

      // CRITICAL ASSERTIONS:
      expect(response.status).toBe(401);
      expect(body.error).toBe("Invalid or expired access token");
    });
  });

  describe("4.2.4 Assigned Endpoint Auth Errors", () => {
    /**
     * Test: Assigned endpoint returns 401 for missing auth
     * 
     * This test verifies that the assigned endpoint returns 401
     * when no authentication token is provided.
     * 
     * Validates: Requirement 2.4
     */
    it("should return 401 for missing auth in assigned endpoint", async () => {
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
          courseAssignment: {
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

      const { GET } = await import("@/app/api/dashboard/courses/assigned/route");

      const request = new Request("http://localhost:3000/api/dashboard/courses/assigned", {
        method: "GET",
      });

      const response = await GET(request as any);
      const body = await response.json();

      // CRITICAL ASSERTIONS:
      expect(response.status).toBe(401);
      expect(body.error).toBe("No access token provided");
    });
  });

  describe("4.2.5 Authenticated Requests Continue to Work", () => {
    /**
     * Test: Discover endpoint returns 200 for authenticated requests
     * 
     * This test verifies that authenticated requests to the discover endpoint
     * continue to return 200 with course data.
     * 
     * Validates: Requirement 3.1
     */
    it("should return 200 for authenticated discover requests", async () => {
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

      const { GET } = await import("@/app/api/dashboard/courses/discover/route");

      const request = new Request("http://localhost:3000/api/dashboard/courses/discover", {
        method: "GET",
        headers: {
          Cookie: "access_token=valid-token",
        },
      }) as any;
      request.nextUrl = new URL("http://localhost:3000/api/dashboard/courses/discover");

      const response = await GET(request);
      const body = await response.json();

      // CRITICAL ASSERTIONS:
      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    /**
     * Test: Enrolled endpoint returns 200 for authenticated requests
     * 
     * This test verifies that authenticated requests to the enrolled endpoint
     * continue to return 200 with enrollment data.
     * 
     * Validates: Requirement 3.2
     */
    it("should return 200 for authenticated enrolled requests", async () => {
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
            lessons: [{ id: "lesson-1" }, { id: "lesson-2" }],
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

      // CRITICAL ASSERTIONS:
      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    /**
     * Test: Assigned endpoint returns 200 for authenticated requests
     * 
     * This test verifies that authenticated requests to the assigned endpoint
     * continue to return 200 with assignment data.
     * 
     * Validates: Requirement 3.3
     */
    it("should return 200 for authenticated assigned requests", async () => {
      const mockAssignments = [
        {
          id: "assignment-1",
          status: "PENDING",
          assignedAt: new Date(),
          notes: "Test assignment",
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

      // CRITICAL ASSERTIONS:
      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});

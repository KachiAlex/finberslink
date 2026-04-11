import { describe, it, expect, beforeEach } from "@jest/globals";
import { jest } from "@jest/globals";

/**
 * Exploratory Tests: Auth Endpoints Error Handling
 * 
 * **Validates: Requirements 2.2, 2.3, 2.4**
 * 
 * These tests explore the bug condition where auth endpoints return 500
 * instead of 401/403 when authentication fails.
 * 
 * EXPECTED BEHAVIOR ON UNFIXED CODE:
 * These tests MUST FAIL on unfixed code because the endpoints return 500
 * instead of the correct 401/403 status codes.
 * 
 * EXPECTED BEHAVIOR AFTER FIX:
 * These tests MUST PASS after the fix to confirm proper error handling.
 * 
 * BUG CONDITION:
 * AuthError is thrown but catch block returns 500 instead of error.status
 * 
 * EXPECTED BEHAVIOR:
 * Catch block should check if error instanceof AuthError and return error.status
 */
describe("Exploratory Tests: Auth Endpoints Return Correct Status Codes", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  /**
   * Test: Discover endpoint returns 401 without auth token
   * 
   * This test verifies that the discover endpoint returns 401 (not 500)
   * when no authentication token is provided.
   * 
   * On UNFIXED code: Test FAILS (returns 500)
   * On FIXED code: Test PASSES (returns 401)
   * 
   * Validates: Requirement 2.2
   */
  it("should return 401 from discover endpoint when no auth token provided", async () => {
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
    });

    const response = await GET(request as any);
    const body = await response.json();

    // CRITICAL ASSERTIONS:
    // On unfixed code: status would be 500
    // On fixed code: status should be 401
    expect(response.status).toBe(401);
    expect(body.error).toBe("No access token provided");
  });

  /**
   * Test: Enrolled endpoint returns 401 without auth token
   * 
   * This test verifies that the enrolled endpoint returns 401 (not 500)
   * when no authentication token is provided.
   * 
   * On UNFIXED code: Test FAILS (returns 500)
   * On FIXED code: Test PASSES (returns 401)
   * 
   * Validates: Requirement 2.3
   */
  it("should return 401 from enrolled endpoint when no auth token provided", async () => {
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
    });

    const response = await GET(request as any);
    const body = await response.json();

    // CRITICAL ASSERTIONS:
    // On unfixed code: status would be 500
    // On fixed code: status should be 401
    expect(response.status).toBe(401);
    expect(body.error).toBe("No access token provided");
  });

  /**
   * Test: Assigned endpoint returns 401 without auth token
   * 
   * This test verifies that the assigned endpoint returns 401 (not 500)
   * when no authentication token is provided.
   * 
   * On UNFIXED code: Test FAILS (returns 500)
   * On FIXED code: Test PASSES (returns 401)
   * 
   * Validates: Requirement 2.4
   */
  it("should return 401 from assigned endpoint when no auth token provided", async () => {
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
    // On unfixed code: status would be 500
    // On fixed code: status should be 401
    expect(response.status).toBe(401);
    expect(body.error).toBe("No access token provided");
  });

  /**
   * Test: Discover endpoint returns 401 with invalid token
   * 
   * This test verifies that the discover endpoint returns 401 (not 500)
   * when an invalid token is provided.
   * 
   * On UNFIXED code: Test FAILS (returns 500)
   * On FIXED code: Test PASSES (returns 401)
   * 
   * Validates: Requirement 2.2
   */
  it("should return 401 from discover endpoint when invalid token provided", async () => {
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

  /**
   * Test: Non-auth errors still return 500
   * 
   * This test verifies that non-authentication errors (like database errors)
   * still return 500 status code, not 401.
   * 
   * On UNFIXED code: Test FAILS (all errors return 500, but we need to verify this is correct)
   * On FIXED code: Test PASSES (non-auth errors return 500, auth errors return 401)
   * 
   * Validates: Requirement 2.2 (preservation)
   */
  it("should return 500 for non-auth errors in discover endpoint", async () => {
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
          findMany: jest.fn().mockRejectedValue(new Error("Database connection failed")),
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
        Cookie: "access_token=valid-token",
      },
    });

    const response = await GET(request as any);
    const body = await response.json();

    // CRITICAL ASSERTIONS:
    // Non-auth errors should still return 500
    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch courses");
  });
});

import { jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

/**
 * Auth Error Handling Tests - Discover Endpoint
 * 
 * **Validates: Requirements 2.2**
 * 
 * These tests verify that the discover endpoint correctly handles authentication errors
 * by returning the appropriate HTTP status code (401) instead of 500.
 * 
 * EXPECTED BEHAVIOR:
 * - Missing auth token: Returns 401 with "No access token provided"
 * - Invalid auth token: Returns 401 with "Invalid or expired access token"
 * - Other errors: Returns 500 with generic error message
 */
describe("GET /api/dashboard/courses/discover - Auth Error Handling", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  /**
   * Test: Missing Authentication Token
   * 
   * When a request is made without an access token,
   * the endpoint should return 401 instead of 500.
   * 
   * Validates: Requirement 2.2
   */
  it("should return 401 when no access token is provided", async () => {
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
        },
        course: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
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
    // The endpoint should return 401, not 500
    expect(response.status).toBe(401);
    expect(body.error).toBe("No access token provided");
  });

  /**
   * Test: Invalid Authentication Token
   * 
   * When a request is made with an invalid token,
   * the endpoint should return 401 instead of 500.
   * 
   * Validates: Requirement 2.2
   */
  it("should return 401 when access token is invalid", async () => {
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
        },
        course: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
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
    // The endpoint should return 401, not 500
    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid or expired access token");
  });

  /**
   * Test: Non-Auth Errors Still Return 500
   * 
   * When a non-auth error occurs (e.g., database error),
   * the endpoint should still return 500.
   * 
   * Validates: Requirement 2.2 (preservation)
   */
  it("should return 500 for non-auth errors", async () => {
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
        status: "ACTIVE",
        tenantId: "tenant-1",
      }),
    }));

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockRejectedValue(new Error("Database connection failed")),
        },
        course: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
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

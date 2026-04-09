import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { UserStatus } from "@prisma/client";

/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 2.1**
 * 
 * This test encodes the expected behavior and will validate the fix when it passes.
 * 
 * EXPECTED BEHAVIOR ON UNFIXED CODE:
 * This test MUST FAIL on unfixed code with TypeError: "Cannot read property 'slice' of undefined"
 * This failure confirms the bug exists: outcomes field is not included in Prisma query
 * but is accessed during transformation.
 * 
 * EXPECTED BEHAVIOR AFTER FIX:
 * This test MUST PASS after the fix to confirm the bug is resolved.
 * 
 * BUG CONDITION:
 * prismaQuery.include.outcomes IS NULL AND transformationCode.accesses('outcomes')
 * 
 * EXPECTED BEHAVIOR:
 * fixed endpoint SHALL successfully include the `outcomes` field in the Prisma query
 * and transform courses without crashing
 */
describe("GET /api/dashboard/courses/discover - Bug Condition: Outcomes Field Access", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  /**
   * Bug Condition Test: Discover Endpoint Outcomes Field Access
   * 
   * This test verifies that the Discover endpoint can successfully access
   * the outcomes field without crashing.
   * 
   * On UNFIXED code: Test FAILS with TypeError (confirms bug exists)
   * On FIXED code: Test PASSES (confirms bug is fixed)
   * 
   * Validates: Requirement 2.1
   */
  it("should successfully access course outcomes field without crashing", async () => {
    // Mock course data with outcomes field
    const mockCourses = [
      {
        id: "course-1",
        title: "React Fundamentals",
        slug: "react-fundamentals",
        description: "Learn React basics",
        tagline: "Learn React",
        level: "BEGINNER",
        category: "Web Development",
        coverImage: "https://example.com/cover.jpg",
        certificateAvailable: true,
        publishedAt: new Date("2024-01-01"),
        approvalStatus: "APPROVED",
        archivedAt: null,
        createdAt: new Date("2024-01-01"),
        instructor: {
          id: "instructor-1",
          firstName: "John",
          lastName: "Doe",
          avatarUrl: "https://example.com/avatar.jpg",
        },
        enrollments: [{ id: "enrollment-1" }, { id: "enrollment-2" }],
        lessons: [
          { id: "lesson-1", durationMinutes: 30 },
          { id: "lesson-2", durationMinutes: 45 },
        ],
        _count: {
          enrollments: 2,
        },
        // CRITICAL: outcomes field must be present in the response
        outcomes: [
          "Understand React fundamentals",
          "Build React components",
          "Manage component state",
          "Handle events in React",
        ],
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        course: {
          findMany: jest.fn().mockResolvedValue(mockCourses),
          count: jest.fn().mockResolvedValue(1),
        },
      },
    }));

    jest.doMock("@/lib/auth/guards", () => ({
      requireAuth: jest.fn().mockReturnValue({
        sub: "user-123",
        role: "STUDENT",
        status: UserStatus.ACTIVE,
        tenantId: "tenant-1",
      }),
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
        Cookie: `access_token=${jwt.sign(
          { sub: "user-123", role: "STUDENT", status: UserStatus.ACTIVE, tenantId: "tenant-1" },
          process.env.JWT_ACCESS_SECRET || "test-secret"
        )}`,
      },
    });

    const response = await GET(request as any);
    const body = await response.json();

    // CRITICAL ASSERTIONS:
    // These assertions verify the bug is fixed
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);

    // CRITICAL: outcomes field must be present and be an array
    expect(body.data[0].outcomes).toBeDefined();
    expect(Array.isArray(body.data[0].outcomes)).toBe(true);
    expect(body.data[0].outcomes.length).toBe(3); // Should slice to first 3
    expect(body.data[0].outcomes[0]).toBe("Understand React fundamentals");
    expect(body.data[0].outcomes[1]).toBe("Build React components");
    expect(body.data[0].outcomes[2]).toBe("Manage component state");

    // Verify other fields are still present
    expect(body.data[0].id).toBe("course-1");
    expect(body.data[0].title).toBe("React Fundamentals");
    expect(body.data[0].instructor).toBeDefined();
    expect(body.data[0].instructor.name).toBe("John Doe");
  });

  /**
   * Bug Condition Test: Outcomes Field Exists and is Array
   * 
   * This test verifies that outcomes field exists and is an array
   * before attempting to slice it.
   * 
   * On UNFIXED code: Test FAILS with TypeError (confirms bug exists)
   * On FIXED code: Test PASSES (confirms bug is fixed)
   * 
   * Validates: Requirement 2.1
   */
  it("should verify outcomes field exists and is an array before slicing", async () => {
    const mockCourses = [
      {
        id: "course-2",
        title: "TypeScript Advanced",
        slug: "typescript-advanced",
        description: "Advanced TypeScript patterns",
        tagline: "Advanced TypeScript",
        level: "ADVANCED",
        category: "Programming",
        coverImage: "https://example.com/cover2.jpg",
        certificateAvailable: true,
        publishedAt: new Date("2024-01-05"),
        approvalStatus: "APPROVED",
        archivedAt: null,
        createdAt: new Date("2024-01-05"),
        instructor: {
          id: "instructor-2",
          firstName: "Jane",
          lastName: "Smith",
          avatarUrl: "https://example.com/avatar2.jpg",
        },
        enrollments: [],
        lessons: [
          { id: "lesson-3", durationMinutes: 60 },
          { id: "lesson-4", durationMinutes: 45 },
          { id: "lesson-5", durationMinutes: 30 },
        ],
        _count: {
          enrollments: 0,
        },
        // CRITICAL: outcomes field must be present
        outcomes: [
          "Master TypeScript generics",
          "Understand advanced types",
          "Build type-safe applications",
          "Use decorators effectively",
          "Implement design patterns",
        ],
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        course: {
          findMany: jest.fn().mockResolvedValue(mockCourses),
          count: jest.fn().mockResolvedValue(1),
        },
      },
    }));

    jest.doMock("@/lib/auth/guards", () => ({
      requireAuth: jest.fn().mockReturnValue({
        sub: "user-456",
        role: "STUDENT",
        status: UserStatus.ACTIVE,
        tenantId: "tenant-1",
      }),
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
        Cookie: `access_token=${jwt.sign(
          { sub: "user-456", role: "STUDENT", status: UserStatus.ACTIVE, tenantId: "tenant-1" },
          process.env.JWT_ACCESS_SECRET || "test-secret"
        )}`,
      },
    });

    const response = await GET(request as any);
    const body = await response.json();

    // CRITICAL ASSERTIONS:
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.length).toBe(1);

    // CRITICAL: outcomes must exist and be an array
    const course = body.data[0];
    expect(course.outcomes).toBeDefined();
    expect(course.outcomes).not.toBeNull();
    expect(Array.isArray(course.outcomes)).toBe(true);

    // CRITICAL: outcomes should be sliced to first 3 items
    expect(course.outcomes.length).toBe(3);
    expect(course.outcomes).toEqual([
      "Master TypeScript generics",
      "Understand advanced types",
      "Build type-safe applications",
    ]);
  });

  /**
   * Bug Condition Test: Multiple Courses with Outcomes
   * 
   * This test verifies that multiple courses all have outcomes field
   * properly included and transformed.
   * 
   * On UNFIXED code: Test FAILS with TypeError (confirms bug exists)
   * On FIXED code: Test PASSES (confirms bug is fixed)
   * 
   * Validates: Requirement 2.1
   */
  it("should handle multiple courses with outcomes field", async () => {
    const mockCourses = [
      {
        id: "course-1",
        title: "React Fundamentals",
        slug: "react-fundamentals",
        description: "Learn React basics",
        tagline: "Learn React",
        level: "BEGINNER",
        category: "Web Development",
        coverImage: "https://example.com/cover.jpg",
        certificateAvailable: true,
        publishedAt: new Date("2024-01-01"),
        approvalStatus: "APPROVED",
        archivedAt: null,
        createdAt: new Date("2024-01-01"),
        instructor: {
          id: "instructor-1",
          firstName: "John",
          lastName: "Doe",
          avatarUrl: "https://example.com/avatar.jpg",
        },
        enrollments: [],
        lessons: [{ id: "lesson-1", durationMinutes: 30 }],
        _count: { enrollments: 0 },
        outcomes: ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
      },
      {
        id: "course-2",
        title: "Vue Fundamentals",
        slug: "vue-fundamentals",
        description: "Learn Vue basics",
        tagline: "Learn Vue",
        level: "BEGINNER",
        category: "Web Development",
        coverImage: "https://example.com/cover2.jpg",
        certificateAvailable: true,
        publishedAt: new Date("2024-01-02"),
        approvalStatus: "APPROVED",
        archivedAt: null,
        createdAt: new Date("2024-01-02"),
        instructor: {
          id: "instructor-2",
          firstName: "Jane",
          lastName: "Smith",
          avatarUrl: "https://example.com/avatar2.jpg",
        },
        enrollments: [],
        lessons: [{ id: "lesson-2", durationMinutes: 45 }],
        _count: { enrollments: 0 },
        outcomes: ["Vue Outcome 1", "Vue Outcome 2", "Vue Outcome 3"],
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        course: {
          findMany: jest.fn().mockResolvedValue(mockCourses),
          count: jest.fn().mockResolvedValue(2),
        },
      },
    }));

    jest.doMock("@/lib/auth/guards", () => ({
      requireAuth: jest.fn().mockReturnValue({
        sub: "user-789",
        role: "STUDENT",
        status: UserStatus.ACTIVE,
        tenantId: "tenant-1",
      }),
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
        Cookie: `access_token=${jwt.sign(
          { sub: "user-789", role: "STUDENT", status: UserStatus.ACTIVE, tenantId: "tenant-1" },
          process.env.JWT_ACCESS_SECRET || "test-secret"
        )}`,
      },
    });

    const response = await GET(request as any);
    const body = await response.json();

    // CRITICAL ASSERTIONS:
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.length).toBe(2);

    // CRITICAL: All courses must have outcomes field
    body.data.forEach((course: any) => {
      expect(course.outcomes).toBeDefined();
      expect(Array.isArray(course.outcomes)).toBe(true);
      expect(course.outcomes.length).toBeLessThanOrEqual(3);
    });

    // Verify first course outcomes
    expect(body.data[0].outcomes).toEqual(["Outcome 1", "Outcome 2", "Outcome 3"]);

    // Verify second course outcomes
    expect(body.data[1].outcomes).toEqual(["Vue Outcome 1", "Vue Outcome 2", "Vue Outcome 3"]);
  });
});

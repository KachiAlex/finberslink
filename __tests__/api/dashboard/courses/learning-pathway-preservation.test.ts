import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { EnrollmentStatus, UserStatus } from "@prisma/client";
import fc from "fast-check";

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * These tests verify NON-BUGGY behavior that must be preserved after the fix.
 * They test queries that do NOT involve string literal enum comparisons.
 * 
 * EXPECTED BEHAVIOR ON UNFIXED CODE:
 * These tests MUST PASS on unfixed code because they test non-buggy queries:
 * - Queries on non-enum columns (text, numbers, dates)
 * - Queries that already use proper enum references
 * - Multiple filter conditions
 * - Response serialization
 * 
 * EXPECTED BEHAVIOR AFTER FIX:
 * These tests MUST CONTINUE TO PASS after the fix to ensure no regressions.
 * 
 * PRESERVATION REQUIREMENTS:
 * 3.1 - Queries on non-enum columns with string values must continue to work
 * 3.2 - Queries using proper enum references must continue to work
 * 3.3 - Multiple filter conditions must continue to apply all filters
 * 3.4 - Enum values in API responses must continue to serialize correctly
 */
describe("GET /api/dashboard/courses/learning-pathway - Preservation Properties", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  /**
   * Property 1: Non-Enum Column Queries Work Correctly
   * 
   * For any query filtering by non-enum columns (title, category, instructor name),
   * the results should match the filter criteria.
   * 
   * Validates: Requirement 3.1
   */
  it("should preserve non-enum column filtering (text search on course title)", async () => {
    const mockEnrollments = [
      {
        id: "enrollment-1",
        userId: "user-123",
        courseId: "course-1",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 50,
        lastAccessedAt: new Date("2024-01-15"),
        createdAt: new Date("2024-01-01"),
        lessonProgress: [],
        course: {
          id: "course-1",
          title: "React Fundamentals",
          slug: "react-fundamentals",
          tagline: "Learn React basics",
          level: "BEGINNER",
          category: "Web Development",
          createdAt: new Date("2024-01-01"),
          instructor: {
            id: "instructor-1",
            firstName: "John",
            lastName: "Doe",
            avatarUrl: "https://example.com/avatar.jpg",
          },
          lessons: [],
        },
      },
      {
        id: "enrollment-2",
        userId: "user-123",
        courseId: "course-2",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 75,
        lastAccessedAt: new Date("2024-01-20"),
        createdAt: new Date("2024-01-05"),
        lessonProgress: [],
        course: {
          id: "course-2",
          title: "TypeScript Basics",
          slug: "typescript-basics",
          tagline: "Learn TypeScript",
          level: "BEGINNER",
          category: "Programming",
          createdAt: new Date("2024-01-05"),
          instructor: {
            id: "instructor-2",
            firstName: "Jane",
            lastName: "Smith",
            avatarUrl: "https://example.com/avatar2.jpg",
          },
          lessons: [],
        },
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue(mockEnrollments),
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

    const { GET } = await import("@/app/api/dashboard/courses/learning-pathway/route");

    // Test with search filter on non-enum column (title)
    const request = new Request(
      "http://localhost:3000/api/dashboard/courses/learning-pathway?search=React",
      {
        method: "GET",
        headers: {
          Cookie: `access_token=${jwt.sign(
            { sub: "user-123", role: "STUDENT", status: UserStatus.ACTIVE, tenantId: "tenant-1" },
            process.env.JWT_ACCESS_SECRET || "test-secret"
          )}`,
        },
      }
    );

    const response = await GET(request as any);
    const body = await response.json();

    // Preservation: Non-enum column filtering must work
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.length).toBe(1);
    expect(body.data[0].title).toBe("React Fundamentals");
    expect(body.counts.filtered).toBe(1);
  });

  /**
   * Property 2: Category Filtering on Non-Enum Column Works
   * 
   * For any query filtering by category (non-enum column),
   * only courses matching the category should be returned.
   * 
   * Validates: Requirement 3.1
   */
  it("should preserve non-enum column filtering (category filter)", async () => {
    const mockEnrollments = [
      {
        id: "enrollment-1",
        userId: "user-123",
        courseId: "course-1",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 50,
        lastAccessedAt: new Date("2024-01-15"),
        createdAt: new Date("2024-01-01"),
        lessonProgress: [],
        course: {
          id: "course-1",
          title: "React Fundamentals",
          slug: "react-fundamentals",
          tagline: "Learn React basics",
          level: "BEGINNER",
          category: "Web Development",
          createdAt: new Date("2024-01-01"),
          instructor: {
            id: "instructor-1",
            firstName: "John",
            lastName: "Doe",
            avatarUrl: "https://example.com/avatar.jpg",
          },
          lessons: [],
        },
      },
      {
        id: "enrollment-2",
        userId: "user-123",
        courseId: "course-2",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 75,
        lastAccessedAt: new Date("2024-01-20"),
        createdAt: new Date("2024-01-05"),
        lessonProgress: [],
        course: {
          id: "course-2",
          title: "Python Basics",
          slug: "python-basics",
          tagline: "Learn Python",
          level: "BEGINNER",
          category: "Programming",
          createdAt: new Date("2024-01-05"),
          instructor: {
            id: "instructor-2",
            firstName: "Jane",
            lastName: "Smith",
            avatarUrl: "https://example.com/avatar2.jpg",
          },
          lessons: [],
        },
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue(mockEnrollments),
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

    const { GET } = await import("@/app/api/dashboard/courses/learning-pathway/route");

    const request = new Request(
      "http://localhost:3000/api/dashboard/courses/learning-pathway?category=Web%20Development",
      {
        method: "GET",
        headers: {
          Cookie: `access_token=${jwt.sign(
            { sub: "user-123", role: "STUDENT", status: UserStatus.ACTIVE, tenantId: "tenant-1" },
            process.env.JWT_ACCESS_SECRET || "test-secret"
          )}`,
        },
      }
    );

    const response = await GET(request as any);
    const body = await response.json();

    // Preservation: Category filtering must work
    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].category).toBe("Web Development");
    expect(body.counts.filtered).toBe(1);
  });

  /**
   * Property 3: Multiple Filter Conditions Apply All Filters
   * 
   * For any query with multiple filter conditions (search + category + progress),
   * all filters should be applied and only matching courses returned.
   * 
   * Validates: Requirement 3.3
   */
  it("should preserve multiple filter conditions (search + category + progress)", async () => {
    const mockEnrollments = [
      {
        id: "enrollment-1",
        userId: "user-123",
        courseId: "course-1",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 50,
        lastAccessedAt: new Date("2024-01-15"),
        createdAt: new Date("2024-01-01"),
        lessonProgress: [
          {
            id: "progress-1",
            enrollmentId: "enrollment-1",
            lessonId: "lesson-1",
            status: "COMPLETED",
            completedAt: new Date("2024-01-10"),
            lesson: {
              id: "lesson-1",
              title: "Introduction to React",
              order: 1,
            },
          },
        ],
        course: {
          id: "course-1",
          title: "React Fundamentals",
          slug: "react-fundamentals",
          tagline: "Learn React basics",
          level: "BEGINNER",
          category: "Web Development",
          createdAt: new Date("2024-01-01"),
          instructor: {
            id: "instructor-1",
            firstName: "John",
            lastName: "Doe",
            avatarUrl: "https://example.com/avatar.jpg",
          },
          lessons: [
            { id: "lesson-1", title: "Introduction to React", order: 1 },
            { id: "lesson-2", title: "Components", order: 2 },
          ],
        },
      },
      {
        id: "enrollment-2",
        userId: "user-123",
        courseId: "course-2",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 0,
        lastAccessedAt: null,
        createdAt: new Date("2024-01-05"),
        lessonProgress: [],
        course: {
          id: "course-2",
          title: "React Advanced",
          slug: "react-advanced",
          tagline: "Advanced React patterns",
          level: "ADVANCED",
          category: "Web Development",
          createdAt: new Date("2024-01-05"),
          instructor: {
            id: "instructor-2",
            firstName: "Jane",
            lastName: "Smith",
            avatarUrl: "https://example.com/avatar2.jpg",
          },
          lessons: [],
        },
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue(mockEnrollments),
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

    const { GET } = await import("@/app/api/dashboard/courses/learning-pathway/route");

    // Apply multiple filters: search=React + category=Web Development + progress=in-progress
    const request = new Request(
      "http://localhost:3000/api/dashboard/courses/learning-pathway?search=React&category=Web%20Development&progress=in-progress",
      {
        method: "GET",
        headers: {
          Cookie: `access_token=${jwt.sign(
            { sub: "user-123", role: "STUDENT", status: UserStatus.ACTIVE, tenantId: "tenant-1" },
            process.env.JWT_ACCESS_SECRET || "test-secret"
          )}`,
        },
      }
    );

    const response = await GET(request as any);
    const body = await response.json();

    // Preservation: All filters must be applied
    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].title).toBe("React Fundamentals");
    expect(body.data[0].category).toBe("Web Development");
    expect(body.data[0].status).toBe("in-progress");
    expect(body.counts.filtered).toBe(1);
  });

  /**
   * Property 4: Response Serialization of Enum Values
   * 
   * For any API response, enum values should serialize correctly
   * and be usable by the client.
   * 
   * Validates: Requirement 3.4
   */
  it("should preserve enum value serialization in responses", async () => {
    const mockEnrollments = [
      {
        id: "enrollment-1",
        userId: "user-123",
        courseId: "course-1",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 100,
        lastAccessedAt: new Date("2024-01-15"),
        createdAt: new Date("2024-01-01"),
        lessonProgress: [
          {
            id: "progress-1",
            enrollmentId: "enrollment-1",
            lessonId: "lesson-1",
            status: "COMPLETED",
            completedAt: new Date("2024-01-10"),
            lesson: {
              id: "lesson-1",
              title: "Lesson 1",
              order: 1,
            },
          },
        ],
        course: {
          id: "course-1",
          title: "Completed Course",
          slug: "completed-course",
          tagline: "A completed course",
          level: "BEGINNER",
          category: "Web Development",
          createdAt: new Date("2024-01-01"),
          instructor: {
            id: "instructor-1",
            firstName: "John",
            lastName: "Doe",
            avatarUrl: "https://example.com/avatar.jpg",
          },
          lessons: [
            { id: "lesson-1", title: "Lesson 1", order: 1 },
          ],
        },
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue(mockEnrollments),
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

    const { GET } = await import("@/app/api/dashboard/courses/learning-pathway/route");

    const request = new Request("http://localhost:3000/api/dashboard/courses/learning-pathway", {
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

    // Preservation: Enum values must serialize correctly
    expect(response.status).toBe(200);
    expect(body.data[0].status).toBe("completed");
    expect(typeof body.data[0].status).toBe("string");
    expect(["in-progress", "completed", "not-started"]).toContain(body.data[0].status);
  });

  /**
   * Property 5: Sorting by Date Works Correctly
   * 
   * For any query with date-based sorting (recent, newest, oldest),
   * courses should be sorted in the correct order.
   * 
   * Validates: Requirement 3.1
   */
  it("should preserve date-based sorting (recent access)", async () => {
    const mockEnrollments = [
      {
        id: "enrollment-1",
        userId: "user-123",
        courseId: "course-1",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 50,
        lastAccessedAt: new Date("2024-01-10"),
        createdAt: new Date("2024-01-01"),
        lessonProgress: [],
        course: {
          id: "course-1",
          title: "Course 1",
          slug: "course-1",
          tagline: "Course 1",
          level: "BEGINNER",
          category: "Web Development",
          createdAt: new Date("2024-01-01"),
          instructor: {
            id: "instructor-1",
            firstName: "John",
            lastName: "Doe",
            avatarUrl: null,
          },
          lessons: [],
        },
      },
      {
        id: "enrollment-2",
        userId: "user-123",
        courseId: "course-2",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 50,
        lastAccessedAt: new Date("2024-01-20"),
        createdAt: new Date("2024-01-05"),
        lessonProgress: [],
        course: {
          id: "course-2",
          title: "Course 2",
          slug: "course-2",
          tagline: "Course 2",
          level: "BEGINNER",
          category: "Web Development",
          createdAt: new Date("2024-01-05"),
          instructor: {
            id: "instructor-2",
            firstName: "Jane",
            lastName: "Smith",
            avatarUrl: null,
          },
          lessons: [],
        },
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue(mockEnrollments),
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

    const { GET } = await import("@/app/api/dashboard/courses/learning-pathway/route");

    const request = new Request(
      "http://localhost:3000/api/dashboard/courses/learning-pathway?dateRange=recent",
      {
        method: "GET",
        headers: {
          Cookie: `access_token=${jwt.sign(
            { sub: "user-123", role: "STUDENT", status: UserStatus.ACTIVE, tenantId: "tenant-1" },
            process.env.JWT_ACCESS_SECRET || "test-secret"
          )}`,
        },
      }
    );

    const response = await GET(request as any);
    const body = await response.json();

    // Preservation: Sorting must work correctly
    expect(response.status).toBe(200);
    expect(body.data.length).toBe(2);
    // Most recently accessed should be first
    expect(body.data[0].title).toBe("Course 2");
    expect(body.data[1].title).toBe("Course 1");
  });

  /**
   * Property 6: Empty Results Handled Correctly
   * 
   * For any query that returns no results,
   * the response should be valid with empty data array.
   * 
   * Validates: Requirement 3.1
   */
  it("should preserve empty result handling", async () => {
    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue([]),
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

    const { GET } = await import("@/app/api/dashboard/courses/learning-pathway/route");

    const request = new Request("http://localhost:3000/api/dashboard/courses/learning-pathway", {
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

    // Preservation: Empty results must be handled correctly
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(0);
    expect(body.counts.total).toBe(0);
    expect(body.counts.filtered).toBe(0);
  });

  /**
   * Property 7: Instructor Data Serialization
   * 
   * For any response with instructor data,
   * instructor information should serialize correctly.
   * 
   * Validates: Requirement 3.4
   */
  it("should preserve instructor data serialization", async () => {
    const mockEnrollments = [
      {
        id: "enrollment-1",
        userId: "user-123",
        courseId: "course-1",
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 50,
        lastAccessedAt: new Date("2024-01-15"),
        createdAt: new Date("2024-01-01"),
        lessonProgress: [],
        course: {
          id: "course-1",
          title: "React Fundamentals",
          slug: "react-fundamentals",
          tagline: "Learn React basics",
          level: "BEGINNER",
          category: "Web Development",
          createdAt: new Date("2024-01-01"),
          instructor: {
            id: "instructor-1",
            firstName: "John",
            lastName: "Doe",
            avatarUrl: "https://example.com/avatar.jpg",
          },
          lessons: [],
        },
      },
    ];

    jest.doMock("@/lib/prisma", () => ({
      prisma: {
        enrollment: {
          findMany: jest.fn().mockResolvedValue(mockEnrollments),
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

    const { GET } = await import("@/app/api/dashboard/courses/learning-pathway/route");

    const request = new Request("http://localhost:3000/api/dashboard/courses/learning-pathway", {
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

    // Preservation: Instructor data must serialize correctly
    expect(response.status).toBe(200);
    expect(body.data[0].instructor).toBeDefined();
    expect(body.data[0].instructor.id).toBe("instructor-1");
    expect(body.data[0].instructor.name).toBe("John Doe");
    expect(body.data[0].instructor.avatar).toBe("https://example.com/avatar.jpg");
  });
});

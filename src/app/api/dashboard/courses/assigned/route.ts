import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/dashboard/courses/assigned
 * Get student's assigned cohort courses
 */
export const GET = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    let session;
    try {
      session = requireAuth(request);
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized", details: "Authentication failed" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      progress: searchParams.get("progress") || "all",
      priority: searchParams.get("priority") || "all",
    };

    // Get course assignments for the student
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        studentId: session.sub,
        status: "ACCEPTED",
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                email: true,
              },
            },
            lessons: {
              select: { id: true, title: true, order: true },
              orderBy: { order: "asc" },
            },
            enrollments: {
              where: { userId: session.sub },
              include: {
                lessonProgress: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    // Get user achievements separately
    const userAchievements = await prisma.studentAchievement.findMany({
      where: {
        userId: session.sub,
      },
    });

    // Transform to AssignedCourse format
    const courses = assignments.map((assignment) => {
      const enrollment = assignment.course.enrollments[0];
      const progress = enrollment?.progressPercentage || 0;
      
      // Determine priority based on deadlines and progress
      let priority: "high" | "medium" | "low" = "medium";
      if (progress < 25) priority = "high";
      else if (progress > 75) priority = "low";

      // Create mock cohort data (in real implementation, this would come from a Cohort model)
      const cohortName = `Cohort ${assignment.course.title.substring(0, 20)}...`;
      const startDate = assignment.assignedAt;
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days later

      // Get classmates (other students in the same course)
      const classmates = enrollment ? [] : []; // Would be populated from actual cohort data

      // Create mock deadlines
      const deadlines = [
        {
          title: "Mid-term Assignment",
          date: new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000),
          type: "assignment" as const,
        },
        {
          title: "Final Project",
          date: new Date(startDate.getTime() + 80 * 24 * 60 * 60 * 1000),
          type: "project" as const,
        },
      ];

      return {
        id: assignment.course.id,
        title: assignment.course.title,
        slug: assignment.course.slug,
        tagline: assignment.course.tagline,
        level: assignment.course.level,
        instructor: assignment.course.instructor
          ? {
              id: assignment.course.instructor.id,
              name: `${assignment.course.instructor.firstName} ${assignment.course.instructor.lastName}`,
              avatar: assignment.course.instructor.avatarUrl,
            }
          : undefined,
        cohort: {
          id: assignment.id,
          name: cohortName,
          startDate,
          endDate,
          instructor: assignment.course.instructor
            ? {
                id: assignment.course.instructor.id,
                name: `${assignment.course.instructor.firstName} ${assignment.course.instructor.lastName}`,
                avatar: assignment.course.instructor.avatarUrl,
                email: assignment.course.instructor.email,
              }
            : undefined,
          classmates,
          deadlines,
        },
        progress,
        priority,
        category: assignment.course.category,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy
          ? `${assignment.assignedBy.firstName} ${assignment.assignedBy.lastName}`
          : "System",
      };
    });

    // Apply filters
    let filteredCourses = courses;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredCourses = filteredCourses.filter((course) =>
        course.title.toLowerCase().includes(searchLower) ||
        course.instructor?.name.toLowerCase().includes(searchLower) ||
        course.cohort.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filteredCourses = filteredCourses.filter((course) =>
        course.category?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.progress !== "all") {
      filteredCourses = filteredCourses.filter((course) => {
        switch (filters.progress) {
          case "in-progress":
            return course.progress > 0 && course.progress < 100;
          case "completed":
            return course.progress >= 100;
          case "not-started":
            return course.progress === 0;
          default:
            return true;
        }
      });
    }

    if (filters.priority !== "all") {
      filteredCourses = filteredCourses.filter((course) => course.priority === filters.priority);
    }

    // Sort by priority and progress
    filteredCourses.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort by progress (lower progress first)
      return a.progress - b.progress;
    });

    return NextResponse.json({
      data: filteredCourses,
      counts: {
        total: courses.length,
        filtered: filteredCourses.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch assigned courses:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { 
        error: "Failed to fetch assigned courses",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

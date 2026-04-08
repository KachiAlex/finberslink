import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/assigned-fallback
 * Shows assigned courses with database fallback to mock data
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== ASSIGNED COURSES FALLBACK API ===");
    
    // Try to get real data first
    try {
      const { prisma } = await import("@/lib/prisma");
      
      // Get your user account
      const studentUser = await prisma.user.findFirst({
        where: { 
          email: "onyedika.akoma@gmail.com",
          role: "STUDENT"
        },
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true 
        },
      });

      if (studentUser) {
        // Get assigned enrollments
        const assignedEnrollments = await prisma.enrollment.findMany({
          where: {
            userId: studentUser.id,
            status: "ASSIGNED",
          },
          select: {
            id: true,
            courseId: true,
            status: true,
            createdAt: true,
            course: {
              select: {
                id: true,
                title: true,
                tagline: true,
                level: true,
                category: true,
                coverImage: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        console.log(`Found ${assignedEnrollments.length} assigned courses from database`);

        const transformedCourses = assignedEnrollments.map((enrollment) => ({
          id: enrollment.course.id,
          title: enrollment.course.title,
          tagline: enrollment.course.tagline || "",
          description: "",
          level: enrollment.course.level?.toLowerCase() || "beginner",
          category: enrollment.course.category || "General",
          coverImage: enrollment.course.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
          progressPercentage: 0,
          lessonsCompleted: 0,
          lessonsCount: 12,
          rating: 4.5 + Math.random() * 0.5,
          reviewCount: Math.floor(Math.random() * 500) + 50,
          price: 0,
          format: "online",
          enrollmentCount: 1,
          instructor: {
            id: "mock-instructor",
            name: "Cynthia Eguzouwa",
            avatar: null,
          },
          createdAt: enrollment.createdAt,
          publishedAt: new Date(),
          duration: 120,
          enrollmentStatus: enrollment.status,
          assignedAt: enrollment.createdAt,
        }));

        return NextResponse.json({
          success: true,
          data: transformedCourses,
          counts: { total: transformedCourses.length, filtered: transformedCourses.length },
          debug: {
            message: "Real assigned courses from database",
            coursesFound: assignedEnrollments.length,
            dataSource: "database",
          }
        });
      }
    } catch (dbError) {
      console.log("Database failed, using mock assigned courses:", dbError.message);
      
      // Fallback to mock assigned courses
      const mockAssignedCourses = [
        {
          id: "cmnmzgol60000ckehhovzyms7",
          title: "Web Development Basics",
          tagline: "Learn the fundamentals of web development",
          description: "Assigned course for your learning journey",
          level: "beginner" as const,
          category: "Web Development",
          coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
          progressPercentage: 0,
          lessonsCompleted: 0,
          lessonsCount: 12,
          rating: 4.8,
          reviewCount: 156,
          price: 0,
          format: "online",
          enrollmentCount: 1,
          instructor: {
            id: "cmmvuk71s00026ysyexzahfop",
            name: "Cynthia Eguzouwa",
            avatar: null,
          },
          createdAt: new Date(),
          publishedAt: new Date(),
          duration: 120,
          enrollmentStatus: "ASSIGNED",
          assignedAt: new Date(),
        },
        {
          id: "cmnmzgpdr0002ckeh0c9o7h5w",
          title: "Python for Data Science",
          tagline: "Learn data science with Python programming",
          description: "Assigned course for your learning journey",
          level: "intermediate" as const,
          category: "Data Science",
          coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
          progressPercentage: 0,
          lessonsCompleted: 0,
          lessonsCount: 24,
          rating: 4.7,
          reviewCount: 289,
          price: 0,
          format: "online",
          enrollmentCount: 1,
          instructor: {
            id: "cmmvuk71s00026ysyexzahfop",
            name: "Cynthia Eguzouwa",
            avatar: null,
          },
          createdAt: new Date(),
          publishedAt: new Date(),
          duration: 120,
          enrollmentStatus: "ASSIGNED",
          assignedAt: new Date(),
        },
      ];

      return NextResponse.json({
        success: true,
        data: mockAssignedCourses,
        counts: { total: mockAssignedCourses.length, filtered: mockAssignedCourses.length },
        debug: {
          message: "Mock assigned courses (database unavailable)",
          coursesFound: mockAssignedCourses.length,
          dataSource: "mock",
          databaseError: dbError.message,
        }
      });
    }
  } catch (error) {
    console.error("Assigned courses fallback API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch assigned courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

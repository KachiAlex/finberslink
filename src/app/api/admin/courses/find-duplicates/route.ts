import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Course = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  instructorId: string;
  instructor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvalStatus: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  _count: {
    enrollments: number;
  };
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["ADMIN", "SUPER_ADMIN"],
      requireTenant: true,
      failureMode: "error",
    });

    // Get ALL courses with their details (ensure no duplicates)
    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        tagline: true,
        description: true,
        instructorId: true,
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvalStatus: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
        _count: {
          select: { enrollments: true }
        }
      },
      distinct: ['id'], // Ensure unique courses
      orderBy: [
        { instructorId: 'asc' },
        { title: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Additional deduplication by ID to be absolutely sure
    const uniqueCourses = Array.from(
      new Map(allCourses.map((course: Course) => [course.id, course])).values()
    );

    // Identify potential duplicates
    const duplicates = [];
    const seen = new Map<string, Course>();

    for (const course of uniqueCourses as Course[]) {
      // Create a key based on title and instructor (case-insensitive)
      const key = `${course.title.toLowerCase().trim()}-${course.instructorId}`;
      
      if (seen.has(key)) {
        const existingCourse = seen.get(key)!;
        // Only consider it a duplicate if it's actually a different course ID
        if (existingCourse.id !== course.id) {
          duplicates.push({
            original: existingCourse,
            duplicate: course,
            similarity: {
              title: course.title.toLowerCase() === existingCourse.title.toLowerCase(),
              instructor: course.instructorId === existingCourse.instructorId,
              slug: course.slug === existingCourse.slug
            }
          });
        }
      } else {
        seen.set(key, course);
      }
    }

    // Also check for similar titles (potential duplicates)
    const similarTitles = [];
    for (let i = 0; i < uniqueCourses.length; i++) {
      for (let j = i + 1; j < uniqueCourses.length; j++) {
        const course1 = uniqueCourses[i] as Course;
        const course2 = uniqueCourses[j] as Course;
        
        // Skip if same instructor (already caught above)
        if (course1.instructorId === course2.instructorId) continue;
        
        // Check for similar titles (simple similarity check)
        const title1 = course1.title.toLowerCase();
        const title2 = course2.title.toLowerCase();
        
        if (title1.includes(title2) || title2.includes(title1) || 
            Math.abs(title1.length - title2.length) < 3) {
          similarTitles.push({
            course1,
            course2,
            similarity: title1 === title2 ? 'identical' : 'similar'
          });
        }
      }
    }

    return NextResponse.json({
      totalCourses: uniqueCourses.length,
      duplicateCount: duplicates.length,
      similarTitleCount: similarTitles.length,
      allCourses: uniqueCourses,
      duplicateGroups: duplicates,
      similarTitleGroups: similarTitles,
      summary: {
        exactDuplicates: duplicates.length,
        similarTitles: similarTitles.length,
        uniqueCourses: uniqueCourses.length - duplicates.length
      }
    });
  } catch (error) {
    console.error("Find duplicates error:", error);
    return NextResponse.json(
      { error: "Failed to find duplicates", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

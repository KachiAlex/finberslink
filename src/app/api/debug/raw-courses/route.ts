import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/debug/raw-courses
 * Get raw courses with minimal filtering
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== RAW COURSES DEBUG ===");
    
    // Test 1: Get absolutely everything
    const allRaw = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        publishedAt: true,
        archivedAt: true,
        createdAt: true,
      },
    });
    
    console.log(`Test 1 - All courses: ${allRaw.length}`);
    
    // Test 2: Get only published courses
    const publishedOnly = await prisma.course.findMany({
      where: {
        publishedAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        archivedAt: true,
      },
    });
    
    console.log(`Test 2 - Published only: ${publishedOnly.length}`);
    
    // Test 3: Get non-archived published courses
    const publishedAndNotArchived = await prisma.course.findMany({
      where: {
        publishedAt: { not: null },
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        archivedAt: true,
      },
    });
    
    console.log(`Test 3 - Published & not archived: ${publishedAndNotArchived.length}`);
    
    // Test 4: Check if any courses have instructor data
    const coursesWithInstructor = await prisma.course.findMany({
      where: {
        publishedAt: { not: null },
        archivedAt: null,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    console.log(`Test 4 - With instructor data: ${coursesWithInstructor.length}`);
    
    return NextResponse.json({
      success: true,
      message: "Raw courses debug completed",
      data: {
        test1_allCourses: {
          count: allRaw.length,
          courses: allRaw,
        },
        test2_publishedOnly: {
          count: publishedOnly.length,
          courses: publishedOnly,
        },
        test3_publishedNotArchived: {
          count: publishedAndNotArchived.length,
          courses: publishedAndNotArchived,
        },
        test4_withInstructor: {
          count: coursesWithInstructor.length,
          courses: coursesWithInstructor.map(c => ({
            id: c.id,
            title: c.title,
            publishedAt: c.publishedAt,
            hasInstructor: !!c.instructor,
            instructor: c.instructor ? `${c.instructor.firstName} ${c.instructor.lastName}` : null,
          })),
        },
      },
      debug: {
        timestamp: new Date().toISOString(),
        message: "Step-by-step course query debugging",
      }
    });
  } catch (error) {
    console.error("Raw courses debug error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to debug raw courses",
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
};

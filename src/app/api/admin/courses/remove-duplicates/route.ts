import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["ADMIN", "SUPER_ADMIN"],
      requireTenant: true,
      failureMode: "error",
    });

    const body = await request.json();
    const { duplicateIds, keepIds, dryRun = false } = body;

    if (!duplicateIds || !Array.isArray(duplicateIds)) {
      return NextResponse.json(
        { error: "duplicateIds array is required" },
        { status: 400 }
      );
    }

    if (!keepIds || !Array.isArray(keepIds)) {
      return NextResponse.json(
        { error: "keepIds array is required" },
        { status: 400 }
      );
    }

    // Validate that keepIds are not in duplicateIds
    const overlap = duplicateIds.filter(id => keepIds.includes(id));
    if (overlap.length > 0) {
      return NextResponse.json(
        { error: "keepIds cannot contain duplicateIds", overlap },
        { status: 400 }
      );
    }

    // Get details of courses to be removed
    const coursesToRemove = await prisma.course.findMany({
      where: { id: { in: duplicateIds } },
      select: {
        id: true,
        title: true,
        slug: true,
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
        _count: {
          select: { 
            enrollments: true,
            lessons: true,
            sections: true
          }
        }
      }
    });

    // Get details of courses to keep
    const coursesToKeep = await prisma.course.findMany({
      where: { id: { in: keepIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        instructorId: true,
        _count: {
          select: { 
            enrollments: true,
            lessons: true,
            sections: true
          }
        }
      }
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldRemove: coursesToRemove,
        wouldKeep: coursesToKeep,
        summary: {
          coursesToRemove: coursesToRemove.length,
          coursesToKeep: coursesToKeep.length,
          totalEnrollmentsAffected: coursesToRemove.reduce((sum, c) => sum + c._count.enrollments, 0),
          totalLessonsAffected: coursesToRemove.reduce((sum, c) => sum + c._count.lessons, 0)
        }
      });
    }

    // Check for enrollments before deletion
    const coursesWithEnrollments = coursesToRemove.filter(c => c._count.enrollments > 0);
    if (coursesWithEnrollments.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot remove courses with enrollments",
          coursesWithEnrollments: coursesWithEnrollments.map(c => ({
            id: c.id,
            title: c.title,
            enrollmentCount: c._count.enrollments
          }))
        },
        { status: 400 }
      );
    }

    // Perform the deletion in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete related data first
      await tx.courseSection.deleteMany({
        where: { courseId: { in: duplicateIds } }
      });

      await tx.lesson.deleteMany({
        where: { courseId: { in: duplicateIds } }
      });

      // Delete the courses
      const deletedCourses = await tx.course.deleteMany({
        where: { id: { in: duplicateIds } }
      });

      return deletedCourses;
    });

    return NextResponse.json({
      success: true,
      removed: result.count,
      removedCourses: coursesToRemove,
      keptCourses: coursesToKeep,
      summary: {
        coursesRemoved: result.count,
        coursesKept: coursesToKeep.length,
        totalEnrollmentsAffected: coursesToRemove.reduce((sum, c) => sum + c._count.enrollments, 0)
      }
    });

  } catch (error) {
    console.error("Remove duplicates error:", error);
    return NextResponse.json(
      { error: "Failed to remove duplicates", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

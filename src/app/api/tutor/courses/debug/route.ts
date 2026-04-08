import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["TUTOR"],
      requireTenant: true,
      failureMode: "error",
    });

    // Get all courses for this tutor (including archived for debugging)
    const allCourses = await prisma.course.findMany({
      where: { instructorId: session.sub },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        category: true,
        level: true,
        approvalStatus: true,
        tutorEditingLocked: true,
        hasPendingEdit: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
        instructorId: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also get total count
    const totalCount = await prisma.course.count({
      where: { instructorId: session.sub }
    });

    return NextResponse.json({
      tutorId: session.sub,
      totalCount,
      courses: allCourses.map(course => ({
        id: course.id,
        title: course.title,
        approvalStatus: course.approvalStatus,
        archivedAt: course.archivedAt,
        createdAt: course.createdAt,
        isArchived: !!course.archivedAt,
        instructorId: course.instructorId
      })),
      debug: "Showing all courses including archived for debugging"
    });
  } catch (error) {
    console.error("Debug courses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug courses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

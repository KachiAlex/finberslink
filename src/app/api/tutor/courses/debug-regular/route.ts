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

    console.log("Debug regular courses for tutor:", session.sub);

    // Get courses exactly like the regular endpoint (excluding archived)
    const regularCourses = await prisma.course.findMany({
      where: { instructorId: session.sub, archivedAt: null },
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

    // Also get archived courses for comparison
    const archivedCourses = await prisma.course.findMany({
      where: { instructorId: session.sub, archivedAt: { not: null } },
      select: {
        id: true,
        title: true,
        archivedAt: true,
        approvalStatus: true,
      },
      orderBy: { archivedAt: "desc" },
    });

    return NextResponse.json({
      tutorId: session.sub,
      regularCoursesCount: regularCourses.length,
      archivedCoursesCount: archivedCourses.length,
      regularCourses: regularCourses.map(course => ({
        id: course.id,
        title: course.title,
        approvalStatus: course.approvalStatus,
        archivedAt: course.archivedAt,
        createdAt: course.createdAt
      })),
      archivedCourses: archivedCourses.map(course => ({
        id: course.id,
        title: course.title,
        approvalStatus: course.approvalStatus,
        archivedAt: course.archivedAt
      })),
      debug: "Comparing regular vs archived courses"
    });
  } catch (error) {
    console.error("Debug regular courses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug regular courses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

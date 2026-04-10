import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["ADMIN", "SUPER_ADMIN"],
      requireTenant: true,
      failureMode: "error",
    });

    console.log("Debug admin courses - session:", session.sub);

    // Get all courses for debugging
    const allCourses = await prisma.course.findMany({
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
        archivedAt: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    console.log("Debug admin courses - total found:", allCourses.length);

    // Filter for live catalog (non-archived, approved courses)
    const liveCatalogCourses = allCourses.filter(course => 
      !course.archivedAt && course.approvalStatus === 'APPROVED'
    );

    console.log("Debug admin courses - live catalog count:", liveCatalogCourses.length);

    return NextResponse.json({
      totalCourses: allCourses.length,
      liveCatalogCount: liveCatalogCourses.length,
      allCourses: allCourses.map(c => ({
        id: c.id,
        title: c.title,
        approvalStatus: c.approvalStatus,
        archivedAt: c.archivedAt,
        instructor: `${c.instructor.firstName} ${c.instructor.lastName}`,
        enrollments: c._count.enrollments
      })),
      liveCatalogCourses: liveCatalogCourses.map(c => ({
        id: c.id,
        title: c.title,
        approvalStatus: c.approvalStatus,
        instructor: `${c.instructor.firstName} ${c.instructor.lastName}`,
        enrollments: c._count.enrollments
      }))
    });
  } catch (error) {
    console.error("Debug admin courses error:", error);
    return NextResponse.json(
      { error: "Failed to debug admin courses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

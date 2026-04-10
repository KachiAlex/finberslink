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
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: "courseIds array is required" },
        { status: 400 }
      );
    }

    console.log("Bulk restoring courses:", courseIds);

    // Restore all courses by setting archivedAt to null
    const result = await prisma.course.updateMany({
      where: { 
        id: { in: courseIds },
        archivedAt: { not: null } // Only restore archived courses
      },
      data: { archivedAt: null }
    });

    console.log("Bulk restore result:", result);

    return NextResponse.json({
      success: true,
      restored: result.count,
      message: `Restored ${result.count} courses`
    });

  } catch (error: any) {
    console.error("Bulk restore error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore courses" },
      { status: 500 }
    );
  }
}

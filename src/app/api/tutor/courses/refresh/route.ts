import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/auth/session";
import { listTutorCourses } from "../../../../../features/tutor/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["TUTOR"],
      requireTenant: true,
      failureMode: "error",
    });

    const courses = await listTutorCourses(session.sub);
    
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      category: course.category,
      level: course.level,
      approvalStatus: course.approvalStatus,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      tutorEditingLocked: course.tutorEditingLocked,
      hasPendingEdit: course.hasPendingEdit,
      enrollmentCount: course.enrollmentCount,
    }));

    return NextResponse.json(formattedCourses);
  } catch (error) {
    console.error("Failed to refresh tutor courses:", error);
    return NextResponse.json(
      { error: "Failed to refresh courses" },
      { status: 500 }
    );
  }
}

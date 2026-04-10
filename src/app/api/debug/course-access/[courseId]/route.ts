import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/debug/course-access/[courseId]
 * Debug course access for current user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    console.log(`=== DEBUG COURSE ACCESS: ${courseId} ===`);
    
    // Get current session
    const { getSessionFromCookies } = await import("../../../../../lib/auth/session");
    const session = await getSessionFromCookies();
    
    if (!session) {
      return NextResponse.json({
        error: "Not authenticated",
        session: null,
        debug: {
          message: "No session found in cookies",
          courseId,
        }
      });
    }
    
    console.log(`Session found: ${JSON.stringify({ userId: session.sub, role: session.role })}`);
    
    // Check course details
    const { prisma } = await import("../../../../../lib/prisma");
    const course = await prisma.course.findFirst({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        approvalStatus: true,
        archivedAt: true,
      },
    });
    
    if (!course) {
      return NextResponse.json({
        error: "Course not found",
        session: { userId: session.sub, role: session.role },
        course: null,
        debug: {
          message: "Course does not exist",
          courseId,
        }
      });
    }
    
    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.sub,
        courseId: courseId,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
    
    // Determine access logic
    const canAccessApprovedCourse = course.approvalStatus === "APPROVED" && course.archivedAt === null;
    const hasEnrollment = enrollment !== null;
    const canAccess = canAccessApprovedCourse || hasEnrollment;
    
    console.log(`Course access check:`, {
      courseTitle: course.title,
      approvalStatus: course.approvalStatus,
      archivedAt: course.archivedAt,
      canAccessApprovedCourse,
      hasEnrollment,
      enrollmentStatus: enrollment?.status,
      canAccess,
    });
    
    return NextResponse.json({
      success: true,
      session: { userId: session.sub, role: session.role },
      course: {
        id: course.id,
        title: course.title,
        approvalStatus: course.approvalStatus,
        archivedAt: course.archivedAt,
      },
      enrollment,
      access: {
        canAccessApprovedCourse,
        hasEnrollment,
        canAccess,
        reason: canAccessApprovedCourse 
          ? "Course is approved and published"
          : hasEnrollment 
            ? "User has enrollment"
            : "No access - course not approved and no enrollment",
      },
      debug: {
        message: "Course access analysis complete",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Debug course access error:", error);
    return NextResponse.json(
      { 
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

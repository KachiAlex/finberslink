import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Forbidden - Tutor access required" },
        { status: 403 }
      );
    }

    const courseId = params.courseId;

    // Verify course exists and belongs to tutor
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: user.sub,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Only allow deleting draft or changes courses
    if (course.approvalStatus === "APPROVED" || course.approvalStatus === "PENDING") {
      return NextResponse.json(
        { error: "Cannot delete published or pending courses. Contact admin if needed." },
        { status: 400 }
      );
    }

    // Delete all related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete lesson resources
      await tx.lessonResource.deleteMany({
        where: { lesson: { courseId } },
      });

      // Delete lessons
      await tx.lesson.deleteMany({
        where: { courseId },
      });

      // Delete exams
      await tx.exam.deleteMany({
        where: { courseId },
      });

      // Delete enrollments
      await tx.enrollment.deleteMany({
        where: { courseId },
      });

      // Delete forum threads
      await tx.forumThread.deleteMany({
        where: { courseId },
      });

      // Delete chat spaces
      await tx.chatSpace.deleteMany({
        where: { courseId },
      });

      // Delete the course itself
      await tx.course.delete({
        where: { id: courseId },
      });
    });

    return NextResponse.json(
      { success: true, message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Course deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}

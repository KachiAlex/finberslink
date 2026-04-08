import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * PUT /api/admin/courses/[courseId]
 * Update a course (admin only) - Simplified version
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = requireAuth(request);
    const courseId = params.courseId;

    console.log('Updating course:', courseId);

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { role: true }
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      console.log('Unauthorized access attempt by:', session.sub);
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existingCourse) {
      console.log('Course not found:', courseId);
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('Received update data:', body);

    // Simple update - just basic fields for now
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.approvalStatus !== undefined) updateData.approvalStatus = body.approvalStatus;

    // Handle arrays safely
    if (body.outcomes !== undefined && Array.isArray(body.outcomes)) {
      updateData.outcomes = body.outcomes;
    }
    if (body.skills !== undefined && Array.isArray(body.skills)) {
      updateData.skills = body.skills;
    }

    console.log('Updating with data:', updateData);

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    console.log('Course updated successfully:', updatedCourse.id);

    return NextResponse.json({
      success: true,
      course: updatedCourse
    });

  } catch (error) {
    console.error("Error updating course:", error);
    
    return NextResponse.json(
      { error: "Failed to update course", details: error.message },
      { status: 500 }
    );
  }
}

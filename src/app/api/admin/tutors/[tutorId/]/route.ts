import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/tutors/[tutorId]
 * Get tutor details and approval status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tutorId: string } }
) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const tutor = await prisma.user.findUnique({
      where: { id: params.tutorId },
      include: {
        tutorApprovalAsStudent: {
          select: {
            id: true,
            status: true,
            notes: true,
            approvedAt: true,
            createdAt: true,
            updatedAt: true,
            admin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        coursesTaught: {
          select: {
            id: true,
            title: true,
            approvalStatus: true,
            enrollments: {
              select: {
                id: true,
              },
            },
          },
        },
        profile: {
          select: {
            headline: true,
            bio: true,
          },
        },
      },
    });

    if (!tutor || tutor.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tutor: {
        id: tutor.id,
        name: `${tutor.firstName} ${tutor.lastName}`,
        email: tutor.email,
        headline: tutor.profile?.headline,
        bio: tutor.profile?.bio,
        approvalStatus: tutor.tutorApprovalAsStudent?.status ?? "PENDING",
        approvalDetails: tutor.tutorApprovalAsStudent,
        courses: tutor.coursesTaught.map((course) => ({
          id: course.id,
          title: course.title,
          approvalStatus: course.approvalStatus,
          enrollmentCount: course.enrollments.length,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching tutor details:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutor details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/tutors/[tutorId]
 * Update tutor approval status
 */
const UpdateApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING", "SUSPENDED"]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tutorId: string } }
) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = UpdateApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { status, notes } = parsed.data;

    // Verify tutor exists
    const tutor = await prisma.user.findUnique({
      where: { id: params.tutorId },
    });

    if (!tutor || tutor.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Update or create approval status
    const approval = await prisma.tutorApproval.upsert({
      where: { tutorId: params.tutorId },
      create: {
        tutorId: params.tutorId,
        approvedBy: user.sub,
        status: status as any,
        notes: notes || null,
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
      update: {
        status: status as any,
        notes: notes || null,
        approvedAt: status === "APPROVED" ? new Date() : null,
        approvedBy: user.sub,
      },
    });

    return NextResponse.json({
      success: true,
      approval: {
        id: approval.id,
        tutorId: approval.tutorId,
        status: approval.status,
        notes: approval.notes,
        approvedAt: approval.approvedAt,
        approvedBy: approval.approvedBy,
      },
    });
  } catch (error) {
    console.error("Error updating tutor approval:", error);
    return NextResponse.json(
      { error: "Failed to update tutor approval" },
      { status: 500 }
    );
  }
}

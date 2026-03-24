import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/tutors
 * List all tutors with their approval status
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as string | null;

    const where: any = {
      role: "TUTOR",
    };

    const tutors = await prisma.user.findMany({
      where,
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by approval status if requested
    const filteredTutors = status
      ? tutors.filter((tutor) => tutor.tutorApprovalAsStudent?.status === status)
      : tutors;

    return NextResponse.json({
      tutors: filteredTutors.map((tutor) => ({
        id: tutor.id,
        name: `${tutor.firstName} ${tutor.lastName}`,
        email: tutor.email,
        approvalStatus: tutor.tutorApprovalAsStudent?.status ?? "PENDING",
        approvalDetails: tutor.tutorApprovalAsStudent,
        totalCourses: tutor.coursesTaught.length,
        approvedCourses: tutor.coursesTaught.filter(
          (c) => c.approvalStatus === "APPROVED"
        ).length,
      })),
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutors" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tutors
 * Create or update tutor approval
 */
const ApprovalSchema = z.object({
  tutorId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED", "PENDING", "SUSPENDED"]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
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
    const parsed = ApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { tutorId, status, notes } = parsed.data;

    // Verify tutor exists
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
    });

    if (!tutor || tutor.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Create or update tutor approval
    const approval = await prisma.tutorApproval.upsert({
      where: { tutorId },
      create: {
        tutorId,
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

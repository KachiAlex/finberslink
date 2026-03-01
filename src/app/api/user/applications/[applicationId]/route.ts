import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    const { applicationId } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            country: true,
            jobType: true,
            remoteOption: true,
            salaryRange: true,
            description: true,
            requirements: true,
          },
        },
        resume: {
          select: {
            id: true,
            title: true,
            summary: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if user owns this application
    if (application.userId !== user.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ApplyJobSchema = z.object({
  resumeId: z.string().min(1),
  coverLetter: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    const { slug } = await params;
    const body = await request.json();
    const parsed = ApplyJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await prisma.jobOpportunity.findUnique({
      where: { slug },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        userId: user.sub,
        jobOpportunityId: job.id,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 400 }
      );
    }

    // Check if resume exists and belongs to user
    const resume = await prisma.resume.findUnique({
      where: { id: parsed.data.resumeId },
    });

    if (!resume || resume.userId !== user.sub) {
      return NextResponse.json(
        { error: "Resume not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        userId: user.sub,
        jobOpportunityId: job.id,
        resumeId: parsed.data.resumeId,
        coverLetter: parsed.data.coverLetter,
      },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Apply job error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import * as FirestoreService from "@/lib/firestore-service";
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

    // Check if job exists (slug is used as jobId in Firestore)
    const job = await FirestoreService.getJobById(slug);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has already applied
    const { applications } = await FirestoreService.listApplicationsByUser(user.sub, 1, 1000);
    const existingApplication = applications.find(
      app => app.jobOpportunityId === job.id && app.userId === user.sub
    );

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 400 }
      );
    }

    // Create application
    const application = await FirestoreService.createApplication({
      userId: user.sub,
      jobOpportunityId: job.id,
      resumeId: parsed.data.resumeId,
      status: 'SUBMITTED',
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

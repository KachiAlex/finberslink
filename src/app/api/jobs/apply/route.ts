import { NextRequest, NextResponse } from "next/server";

import { createJobApplication } from "@/features/jobs/service";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const ApplyJobSchema = z.object({
  jobOpportunityId: z.string(),
  resumeId: z.string(),
  coverLetter: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    
    const body = await request.json();
    const parsed = ApplyJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const application = await createJobApplication({
      ...parsed.data,
      userId: user.sub,
    });

    return NextResponse.json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

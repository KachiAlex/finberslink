import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createJobAlert,
  deleteJobAlert,
  findMatchingJobs,
  getJobAlertById,
  getSuggestedKeywords,
  getUserJobAlerts,
  updateJobAlert,
} from "@/features/jobs/alerts.service";
import { requireAuth } from "@/lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import type { JobType } from "@prisma/client";

export const runtime = "nodejs";

const CreateAlertSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  location: z.string().optional().nullable(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional().nullable(),
});

const UpdateAlertSchema = CreateAlertSchema.partial();

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/jobs/alerts
 * Get all job alerts for the current user
 */
export const GET = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    const alerts = await getUserJobAlerts(session.sub);

    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching job alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
});

/**
 * POST /api/jobs/alerts
 * Create a new job alert
 */
export const POST = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const validation = CreateAlertSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const validated = validation.data;
    const alert = await createJobAlert({
      userId: session.sub,
      keywords: validated.keywords,
      location: validated.location,
      jobType: validated.jobType as JobType | undefined,
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("Error creating job alert:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
});

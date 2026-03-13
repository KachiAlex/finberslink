import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteJobAlert,
  findMatchingJobs,
  getJobAlertById,
  updateJobAlert,
} from "@/features/jobs/alerts.service";
import { requireAuth } from "@/lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { validateInput } from "@/lib/validation/schemas";
import type { JobType } from "@prisma/client";

export const runtime = "nodejs";

const UpdateAlertSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).optional(),
  location: z.string().optional().nullable(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional().nullable(),
});

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/jobs/alerts/[alertId]
 * Get a specific job alert with matching jobs
 */
export const GET = rateLimitMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { alertId: string } }
  ) => {
    try {
      const session = requireAuth(request);
      const alertId = params.alertId;

      if (!alertId) {
        return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
      }

      const alert = await getJobAlertById(alertId);

      if (!alert) {
        return NextResponse.json({ error: "Alert not found" }, { status: 404 });
      }

      // Verify ownership
      if (alert.userId !== session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Get matching jobs for this alert
      const matchingJobs = await findMatchingJobs(
        {
          keywords: alert.keywords,
          location: alert.location,
          jobType: alert.jobType,
        },
        20
      );

      return NextResponse.json(
        {
          alert,
          matchingJobs,
          matchCount: matchingJobs.length,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error fetching job alert:", error);
      return NextResponse.json({ error: "Failed to fetch alert" }, { status: 500 });
    }
  }
);

/**
 * PATCH /api/jobs/alerts/[alertId]
 * Update a job alert
 */
export const PATCH = rateLimitMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { alertId: string } }
  ) => {
    try {
      const session = requireAuth(request);
      const alertId = params.alertId;

      if (!alertId) {
        return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
      }

      // Verify ownership
      const alert = await getJobAlertById(alertId);
      if (!alert || alert.userId !== session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const body = await request.json();
      const validated = validateInput(UpdateAlertSchema, body);

      const updated = await updateJobAlert(alertId, {
        userId: session.sub,
        ...(validated.keywords && { keywords: validated.keywords }),
        ...(validated.location !== undefined && { location: validated.location }),
        ...(validated.jobType !== undefined && { jobType: validated.jobType as JobType | undefined }),
      });

      return NextResponse.json({ alert: updated }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
      }
      console.error("Error updating job alert:", error);
      return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/jobs/alerts/[alertId]
 * Delete a job alert
 */
export const DELETE = rateLimitMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { alertId: string } }
  ) => {
    try {
      const session = requireAuth(request);
      const alertId = params.alertId;

      if (!alertId) {
        return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
      }

      // Verify ownership
      const alert = await getJobAlertById(alertId);
      if (!alert || alert.userId !== session.sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      await deleteJobAlert(alertId);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error("Error deleting job alert:", error);
      return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
    }
  }
);

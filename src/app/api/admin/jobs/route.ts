import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAllJobs, getJobStats, bulkUpdateJobFeatured } from "@/features/jobs/admin-service";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const CreateJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  country: z.string().min(1),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
  remoteOption: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  description: z.string().optional(),
  salaryRange: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const ListJobsSchema = z.object({
  skip: z.coerce.number().int().nonnegative().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(["recent", "featured", "views"]).optional(),
});

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/admin/jobs
 * Get all jobs with filtering and pagination (admin only)
 */
export const GET = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    requireRole(session, "ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(request.url);
    const params = ListJobsSchema.parse(Object.fromEntries(searchParams));

    const jobs = await getAllJobs({
      skip: params.skip || 0,
      take: params.take || 20,
      search: params.search,
      featured: params.featured,
      active: undefined,
      sortBy: params.sortBy || "recent",
    });

    return NextResponse.json(jobs, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
});

/**
 * POST /api/admin/jobs
 * Create a new job posting (admin only)
 */
export const POST = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    requireRole(session, "ADMIN", "SUPER_ADMIN");

    const body = await request.json();
    const parsed = CreateJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const job = await prisma.jobOpportunity.create({
      data: {
        title: parsed.data.title,
        company: parsed.data.company,
        location: parsed.data.location,
        country: parsed.data.country,
        jobType: parsed.data.jobType,
        remoteOption: parsed.data.remoteOption,
        description: parsed.data.description || "",
        requirements: parsed.data.requirements || [],
        tags: parsed.data.tags || [],
        featured: false,
        isActive: true,
        postedById: session.sub,
      },
    });

    return NextResponse.json(
      { message: "Job created successfully", job },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
});

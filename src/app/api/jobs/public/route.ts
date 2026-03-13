import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const ListJobsSchema = z.object({
  skip: z.coerce.number().int().nonnegative().optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
  search: z.string().optional(),
  location: z.string().optional(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional(),
  remoteOption: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
  sortBy: z.enum(["recent", "featured", "trending"]).optional(),
});

const publicRateLimit = createRateLimit(rateLimitPresets.public);

/**
 * GET /api/jobs/public
 * Get publicly available jobs without authentication
 */
export const GET = publicRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const params = ListJobsSchema.parse(Object.fromEntries(searchParams));

    const skip = params.skip || 0;
    const take = params.take || 20;

    // Build where clause for filtering
    const where: any = {
      isActive: true,
      status: "OPEN",
    };

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { company: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.location) {
      where.location = { contains: params.location, mode: "insensitive" };
    }

    if (params.jobType) {
      where.jobType = params.jobType;
    }

    if (params.remoteOption) {
      where.remoteOption = params.remoteOption;
    }

    // Build orderBy clause
    const orderBy: any = {};
    switch (params.sortBy) {
      case "featured":
        orderBy.featured = "desc";
        orderBy.createdAt = "desc";
        break;
      case "trending":
        orderBy.viewCount = "desc";
        break;
      case "recent":
      default:
        orderBy.createdAt = "desc";
    }

    // Fetch jobs with necessary fields only (exclude sensitive data)
    const jobs = await prisma.jobOpportunity.findMany({
      where,
      skip,
      take,
      orderBy,
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
        tags: true,
        featured: true,
        viewCount: true,
        createdAt: true,
        requirements: true,
      },
    });

    const total = await prisma.jobOpportunity.count({ where });

    // Increment view count for each job (fire-and-forget)
    if (jobs.length > 0) {
      prisma.jobOpportunity.updateMany({
        where: { id: { in: jobs.map((j) => j.id) } },
        data: { viewCount: { increment: 1 } },
      }).catch((err) => console.error("Failed to update view count:", err));
    }

    return NextResponse.json(
      {
        jobs,
        pagination: {
          skip,
          take,
          total,
          hasMore: skip + take < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching public jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
});

/**
 * GET /api/jobs/public/featured
 * Get featured jobs for homepage - exported for import in featured route
 */
export async function getJobsFeatured(request: NextRequest) {
  try {
    const limit = new URL(request.url).searchParams.get("limit");
    const take = limit ? Math.min(parseInt(limit), 20) : 6;

    const jobs = await prisma.jobOpportunity.findMany({
      where: {
        isActive: true,
        featured: true,
        status: "OPEN",
      },
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        jobType: true,
        remoteOption: true,
        salaryRange: true,
        tags: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        jobs,
        total: jobs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching featured jobs:", error);
    return NextResponse.json({ error: "Failed to fetch featured jobs" }, { status: 500 });
  }
}

/**
 * GET /api/jobs/public/[id]
 * Get detailed job information - exported for import in [id] route
 */
export async function getJobDetail(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const job = await prisma.jobOpportunity.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        jobType: true,
        remoteOption: true,
        description: true,
        salaryRange: true,
        requirements: true,
        tags: true,
        featured: true,
        isActive: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        postedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!job || !job.isActive) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Increment view count
    prisma.jobOpportunity.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch((err) => console.error("Failed to update view count:", err));

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error("Error fetching job detail:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

/**
 * GET /api/jobs/public/search/suggestions
 * Get search suggestions based on titles and companies - exported for suggestions route
 */
export async function getJobSearchSuggestions(request: NextRequest) {
  try {
    const query = new URL(request.url).searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const [titles, companies] = await Promise.all([
      prisma.jobOpportunity.findMany({
        where: {
          isActive: true,
          title: { contains: query, mode: "insensitive" },
        },
        distinct: ["title"],
        select: { title: true },
        take: 5,
      }),
      prisma.jobOpportunity.findMany({
        where: {
          isActive: true,
          company: { contains: query, mode: "insensitive" },
        },
        distinct: ["company"],
        select: { company: true },
        take: 5,
      }),
    ]);

    const suggestions = [
      ...titles.map((t) => ({ type: "title", value: t.title })),
      ...companies.map((c) => ({ type: "company", value: c.company })),
    ];

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}

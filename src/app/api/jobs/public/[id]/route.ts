import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const publicRateLimit = createRateLimit(rateLimitPresets.public);

/**
 * GET /api/jobs/public/[id]
 * Get detailed job information (public, no auth required)
 */
export const GET = publicRateLimit(async (request: NextRequest, { params }: { params: { id: string } }) => {
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

    // Increment view count (fire-and-forget)
    prisma.jobOpportunity.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch((err) => console.error("Failed to update view count:", err));

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error("Error fetching job detail:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
});

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const publicRateLimit = createRateLimit(rateLimitPresets.public);

/**
 * GET /api/jobs/public/search/suggestions
 * Get search suggestions based on job titles and company names
 */
export const GET = publicRateLimit(async (request: NextRequest) => {
  try {
    const query = new URL(request.url).searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const [titles, companies] = await Promise.all([
      prisma.jobOpportunity.findMany({
        where: {
          isActive: true,
          status: "OPEN",
          title: { contains: query, mode: "insensitive" },
        },
        distinct: ["title"],
        select: { title: true },
        take: 5,
      }),
      prisma.jobOpportunity.findMany({
        where: {
          isActive: true,
          status: "OPEN",
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
    ].slice(0, 10); // Limit total suggestions to 10

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
});

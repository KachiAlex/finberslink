import { NextRequest, NextResponse } from "next/server";

import { getJobs } from "@/features/jobs/service";
import { z } from "zod";

const JobsQuerySchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional(),
  remoteOption: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
  company: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(",").filter(Boolean) : undefined),
  featured: z.string().optional().transform(val => val === "true"),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = JobsQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await getJobs(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

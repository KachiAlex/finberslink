import { NextRequest, NextResponse } from "next/server";
import type { JobType, RemoteOption } from "@prisma/client";
import { getJobs } from "@/features/jobs/service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      search: searchParams.get("search") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      jobType: searchParams.get("jobType") as JobType | undefined,
      remoteOption: searchParams.get("remoteOption") as RemoteOption | undefined,
      company: searchParams.get("company") ?? undefined,
      tags: searchParams.get("tags")
        ? searchParams.get("tags")!.split(",").filter(Boolean)
        : undefined,
      featured: searchParams.get("featured") === "true",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10,
    };

    const result = await getJobs(filters);

    return NextResponse.json({
      jobs: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

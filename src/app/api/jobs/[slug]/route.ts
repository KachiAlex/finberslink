import { NextRequest, NextResponse } from "next/server";

import { getJobBySlug } from "@/features/jobs/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const job = await getJobBySlug(slug);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Job fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

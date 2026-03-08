import { NextResponse } from "next/server";

import { incrementJobViewCount } from "@/features/jobs/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    await incrementJobViewCount(jobId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Job view increment error", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}

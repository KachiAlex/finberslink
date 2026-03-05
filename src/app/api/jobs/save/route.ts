import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { saveJob, unsaveJob } from "@/features/jobs/service";
import { z } from "zod";

const SaveJobSchema = z.object({
  jobId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = verifyToken(accessToken);
    const body = await request.json();
    const parsed = SaveJobSchema.parse(body);

    const saved = await saveJob(user.sub, parsed.jobId);
    return NextResponse.json({ saved: true, id: saved.id });
  } catch (error) {
    console.error("Save job error:", error);
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = verifyToken(accessToken);
    const body = await request.json();
    const parsed = SaveJobSchema.parse(body);

    await unsaveJob(user.sub, parsed.jobId);
    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error("Unsave job error:", error);
    return NextResponse.json({ error: "Failed to unsave job" }, { status: 500 });
  }
}

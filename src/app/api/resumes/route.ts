import { NextRequest, NextResponse } from "next/server";

import { listUserResumes } from "@/features/resume/service";
import { requireAuth } from "@/lib/auth/guards";

export const runtime = "nodejs";

/**
 * GET /api/resumes
 * Get all resumes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const resumes = await listUserResumes(session.userId);
    
    return NextResponse.json({ resumes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}

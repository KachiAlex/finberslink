import { NextRequest, NextResponse } from "next/server";

import { getTutorForumThreads } from "@/features/tutor/service";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden - Tutor access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam) || 30, 50) : 30;

    const threads = await getTutorForumThreads(user.sub, limit, q);
    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Tutor forum threads fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch forum threads" }, { status: 500 });
  }
}

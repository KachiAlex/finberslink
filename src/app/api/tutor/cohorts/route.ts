import { NextRequest, NextResponse } from "next/server";

import { getTutorCohorts } from "@/features/tutor/service";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Forbidden - Tutor access required" },
        { status: 403 }
      );
    }

    const cohorts = await getTutorCohorts(user.sub);
    return NextResponse.json({ cohorts });
  } catch (error) {
    console.error("Tutor cohorts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutor cohorts" },
      { status: 500 }
    );
  }
}

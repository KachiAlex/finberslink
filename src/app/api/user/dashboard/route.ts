import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import * as FirestoreService from "@/lib/firestore-service";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);

    const { applications, total } = await FirestoreService.listApplicationsByUser(user.sub, 1, 100);

    // Calculate status breakdown
    const statusBreakdown: Record<string, number> = {};
    applications.forEach(app => {
      statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
    });

    // Get recent applications (first 5)
    const recentApplications = applications.slice(0, 5);

    return NextResponse.json({
      user: {
        id: user.sub,
        role: user.role,
      },
      stats: {
        totalApplications: total,
        resumes: 0,
        statusBreakdown,
      },
      recentApplications,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

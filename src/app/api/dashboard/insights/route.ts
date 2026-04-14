import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDashboardInsights,
  getEmployerDashboardInsights,
  getStudentDashboardInsights,
  getTutorDashboardInsights,
  getUserActivityFeed,
} from "@/features/dashboard/insights";
import { requireAuth } from "@/lib/auth/guards";
import type { Role } from "@prisma/client";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/insights
 * Get role-based dashboard insights for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const role = session.role as Role;

    let insights: any = {};

    // Get role-specific insights
    switch (role) {
      case "STUDENT":
        insights = await getStudentDashboardInsights(session.userId);
        break;
      case "TUTOR":
        insights = await getTutorDashboardInsights(session.userId);
        break;
      case "EMPLOYER":
        insights = await getEmployerDashboardInsights(session.userId);
        break;
      case "ADMIN":
        insights = await getAdminDashboardInsights(session.userId);
        break;
      case "SUPER_ADMIN":
        insights = await getAdminDashboardInsights(session.userId);
        break;
      default:
        return NextResponse.json(
          { error: "User role not recognized for insights" },
          { status: 400 }
        );
    }

    // Get activity feed (common to all users)
    const activityFeed = await getUserActivityFeed(session.userId);

    return NextResponse.json(
      {
        role,
        insights,
        activityFeed,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    
    // Check if user is admin
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalJobs, totalApplications, applicationsByStatus, jobsByType, jobsByRemote] = await Promise.all([
      prisma.jobOpportunity.count(),
      prisma.jobApplication.count(),
      prisma.jobApplication.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.jobOpportunity.groupBy({
        by: ["jobType"],
        _count: true,
      }),
      prisma.jobOpportunity.groupBy({
        by: ["remoteOption"],
        _count: true,
      }),
    ]);

    // Get top jobs by applications
    const topJobs = await prisma.jobOpportunity.findMany({
      select: {
        id: true,
        title: true,
        company: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Get recent applications
    const recentApplications = await prisma.jobApplication.findMany({
      select: {
        id: true,
        status: true,
        submittedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        opportunity: {
          select: {
            title: true,
            company: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 10,
    });

    const statusBreakdown = applicationsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const typeDistribution = jobsByType.reduce(
      (acc, item) => {
        acc[item.jobType] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const remoteDistribution = jobsByRemote.reduce(
      (acc, item) => {
        acc[item.remoteOption] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      metrics: {
        totalJobs,
        totalApplications,
        avgApplicationsPerJob: totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0,
      },
      statusBreakdown,
      typeDistribution,
      remoteDistribution,
      topJobs,
      recentApplications,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

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

    const [totalApplications, applicationsByStatus, recentApplications, savedJobs] = await Promise.all([
      prisma.jobApplication.count({ where: { userId: user.sub } }),
      prisma.jobApplication.groupBy({
        by: ["status"],
        where: { userId: user.sub },
        _count: true,
      }),
      prisma.jobApplication.findMany({
        where: { userId: user.sub },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),
      prisma.resume.count({ where: { userId: user.sub } }),
    ]);

    const statusBreakdown = applicationsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      user: {
        id: user.sub,
        role: user.role,
      },
      stats: {
        totalApplications,
        resumes: savedJobs,
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

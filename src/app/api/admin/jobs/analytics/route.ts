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

    const jobs = await prisma.jobOpportunity.findMany({ take: 1000 });
    const allApplications = await prisma.jobApplication.findMany({ take: 1000 });

    const totalJobs = await prisma.jobOpportunity.count();
    const totalApplications = await prisma.jobApplication.count();

    // Calculate status breakdown
    const statusBreakdown: Record<string, number> = {};
    allApplications.forEach(app => {
      statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
    });

    // Calculate type distribution
    const typeDistribution: Record<string, number> = {};
    jobs.forEach(job => {
      typeDistribution[job.jobType] = (typeDistribution[job.jobType] || 0) + 1;
    });

    // Calculate remote distribution
    const remoteDistribution: Record<string, number> = {};
    jobs.forEach(job => {
      remoteDistribution[job.remoteOption] = (remoteDistribution[job.remoteOption] || 0) + 1;
    });

    // Get top 5 jobs (by creation date)
    const topJobs = jobs.slice(0, 5).map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      applicationCount: allApplications.filter(app => app.jobOpportunityId === job.id).length,
    }));

    // Get recent applications (last 10)
    const recentApplications = allApplications.slice(0, 10);

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

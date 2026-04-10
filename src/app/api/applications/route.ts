import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["STUDENT"],
      failureMode: "redirect",
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId: session.sub },
      include: {
        opportunity: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        status: app.status,
        submittedAt: app.submittedAt.toISOString(),
        opportunity: {
          id: app.opportunity.id,
          title: app.opportunity.title,
          company: app.opportunity.company,
          location: app.opportunity.location,
          jobType: app.opportunity.jobType,
          salaryRange: app.opportunity.salaryRange,
          description: app.opportunity.description,
          slug: app.opportunity.slug,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

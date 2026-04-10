import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { shareDashboardService } from "@/features/resume/share-dashboard-service";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/resumes/{resumeId}/share-dashboard
 * Get share link management dashboard data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify resume belongs to user
    const resume = await prisma.resume.findUnique({
      where: { id: params.resumeId },
      select: { userId: true },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "active"
      | "expired"
      | "revoked"
      | null;
    const includeMetrics = searchParams.get("metrics") === "true";

    let data;

    if (status) {
      const links = await shareDashboardService.getShareLinksByStatus(
        params.resumeId,
        status
      );
      data = { links, status };
    } else {
      const { links, summary } =
        await shareDashboardService.getShareLinksWithDetails(params.resumeId);
      data = { links, summary };
    }

    if (includeMetrics) {
      const metrics = await shareDashboardService.getPerformanceMetrics(
        params.resumeId
      );
      data.metrics = metrics;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `[GET /api/resumes/${params.resumeId}/share-dashboard] Error:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

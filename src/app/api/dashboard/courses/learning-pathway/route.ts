import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({ failureMode: "error" });
    const userId = session.sub;
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const progress = searchParams.get("progress") || "all";
    const status = searchParams.get("status") || "active";
    const dateRange = searchParams.get("dateRange") || "recent";

    // Build where clause - use raw string comparison to avoid enum cast issues
    const where: any = { userId };

    // Fetch enrollments with course data
    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        progressPercentage: true,
        createdAt: true,
        completedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            tagline: true,
            level: true,
            category: true,
            coverImage: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    // Filter by status in JS to avoid enum comparison issues
    const filtered = enrollments.filter((e) => {
      if (status === "active") return e.status === "ACTIVE";
      if (status === "completed") return e.status === "COMPLETED";
      return true;
    });

    // Apply search filter
    const searched = search
      ? filtered.filter((e) =>
          e.course.title.toLowerCase().includes(search.toLowerCase())
        )
      : filtered;

    // Apply category filter
    const categorized =
      category !== "all"
        ? searched.filter((e) => e.course.category === category)
        : searched;

    // Apply progress filter
    const progressFiltered =
      progress !== "all"
        ? categorized.filter((e) => {
            if (progress === "not-started") return e.progressPercentage === 0;
            if (progress === "in-progress")
              return e.progressPercentage > 0 && e.progressPercentage < 100;
            if (progress === "completed") return e.progressPercentage === 100;
            return true;
          })
        : categorized;

    const courses = progressFiltered.map((enrollment) => ({
      enrollmentId: enrollment.id,
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      tagline: enrollment.course.tagline,
      level: enrollment.course.level,
      category: enrollment.course.category,
      coverImage: enrollment.course.coverImage,
      instructor: enrollment.course.instructor,
      progressPercentage: enrollment.progressPercentage,
      enrolledAt: enrollment.createdAt,
      completedAt: enrollment.completedAt,
      lessonsCount: enrollment.course.lessons.length,
      status: enrollment.status,
    }));

    return NextResponse.json({
      courses,
      total: courses.length,
      tab: "learning-pathway",
    });
  } catch (error: any) {
    console.error("Failed to fetch learning pathway courses:", error);
    console.error("Error details:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch courses", courses: [] },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listDashboardCatalogCourses } from "@/features/lms/data/course-service";
import { AuthError, requireAuth } from "@/lib/auth/guards";

const ListDashboardCoursesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  sort: z.enum(["recent", "popular"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(24).optional(),
});

export async function GET(request: NextRequest) {
  try {
    let session;
    try {
      session = requireAuth(request);
    } catch (authError) {
      console.error("[api/dashboard/courses] Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can view dashboard catalog" },
        { status: 403 }
      );
    }

    const urlParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validParams = ListDashboardCoursesSchema.safeParse(urlParams);

    if (!validParams.success) {
      console.error("[api/dashboard/courses] Validation error:", validParams.error.issues);
      return NextResponse.json(
        { error: "Invalid query parameters", issues: validParams.error.issues },
        { status: 400 }
      );
    }

    const params = validParams.data;
    const result = await listDashboardCatalogCourses({
      search: params.search?.trim() ? params.search.trim() : undefined,
      category: params.category?.trim() ? params.category.trim() : undefined,
      level: params.level,
      sort: params.sort || "recent",
      page: params.page || 1,
      pageSize: params.pageSize || 12,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[api/dashboard/courses] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to load catalog courses",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

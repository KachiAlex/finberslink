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
    const session = requireAuth(request);

    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can view dashboard catalog" }, { status: 403 });
    }

    const urlParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const params = ListDashboardCoursesSchema.parse(urlParams);

    const result = await listDashboardCatalogCourses({
      search: params.search?.trim() ? params.search.trim() : undefined,
      category: params.category?.trim() ? params.category.trim() : undefined,
      level: params.level,
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", issues: error.issues }, { status: 400 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[api/dashboard/courses] unexpected error", error);
    return NextResponse.json({ error: "Failed to load catalog courses" }, { status: 500 });
  }
}

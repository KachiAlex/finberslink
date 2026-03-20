import { redirect } from "next/navigation";
import { Compass, GraduationCap } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { getStudentEnrollments } from "@/features/dashboard/service";
import { listDashboardCatalogCourses } from "@/features/lms/data/course-service";
import { DashboardCoursesClient } from "./dashboard-courses-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LevelQuery = "beginner" | "intermediate" | "advanced";
type SortQuery = "recent" | "popular";

interface DashboardCoursesPageProps {
  searchParams?: Record<string, string | string[]>;
}

export default async function DashboardCoursesPage({ searchParams }: DashboardCoursesPageProps) {
  const session = await requireSession({ failureMode: "error" });

  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const rawSearch = typeof searchParams?.search === "string" ? searchParams.search : "";
  const levelParam = typeof searchParams?.level === "string" ? searchParams.level.toLowerCase() : "all";
  const level: LevelQuery | "all" = ["beginner", "intermediate", "advanced"].includes(levelParam)
    ? (levelParam as LevelQuery)
    : "all";
  const categoryParam = typeof searchParams?.category === "string" ? searchParams.category : "all";
  const sortParam = typeof searchParams?.sort === "string" ? searchParams.sort : "recent";
  const sort: SortQuery = ["recent", "popular"].includes(sortParam) ? (sortParam as SortQuery) : "recent";
  const pageParam = Number(searchParams?.page);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [enrollments, catalog] = await Promise.all([
    getStudentEnrollments(session.sub),
    listDashboardCatalogCourses({
      search: rawSearch?.trim() ? rawSearch.trim() : undefined,
      level: level === "all" ? undefined : level,
      category: categoryParam === "all" ? undefined : categoryParam,
      sort,
      page,
    }),
  ]);

  const assigned = enrollments.map((enrollment) => ({
    id: enrollment.id,
    progress: enrollment.progressPercentage ?? 0,
    course: {
      id: enrollment.course.id,
      title: enrollment.course.title,
      slug: enrollment.course.slug ?? enrollment.course.id,
      level: enrollment.course.level?.toLowerCase() ?? null,
      tagline: enrollment.course.tagline ?? null,
      category: enrollment.course.category ?? null,
    },
  }));

  return (
    <div className="space-y-10">
      <DashboardHero
        eyebrow="Courses hub"
        title="Own every cohort from one place"
        description="Jump back into assigned programs or explore new catalog tracks without leaving the dashboard."
        accent="blue"
        actions={[
          { label: "Browse catalog", href: "/courses", icon: Compass },
          { label: "View enrollments", href: "/dashboard/courses", icon: GraduationCap, variant: "secondary" },
        ]}
      />

      <DashboardCoursesClient
        assigned={assigned}
        initialCatalog={catalog.courses}
        initialPagination={catalog.pagination}
        initialFilters={{
          search: rawSearch ?? "",
          level,
          category: categoryParam,
          sort,
          page: catalog.pagination.page,
        }}
      />
    </div>
  );
}

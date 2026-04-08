import { redirect } from "next/navigation";
import { Compass, GraduationCap, Sparkles, TrendingUp } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { getStudentEnrollments } from "@/features/dashboard/service";
import { listDashboardCatalogCourses } from "@/features/lms/data/course-service";
import { DashboardCoursesClient } from "./dashboard-courses-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LevelQuery = "beginner" | "intermediate" | "advanced";
type SortQuery = "recent" | "popular";

// Gradient Text Component
const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
    {children}
  </span>
);

export default async function DashboardCoursesPage(props: any) {
  const searchParams = await props.searchParams;
  const session = await requireSession({ failureMode: "error" });

  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  try {
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
    status: enrollment.status,
    progress: enrollment.progressPercentage ?? 0,
    acceptedAt: null, // TODO: Add acceptedAt column to Enrollment table
    assignment: null,
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
          title={<>Own every cohort from <GradientText>one place</GradientText></>}
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
  } catch (error) {
    console.error("Failed to load courses page:", error);
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
        
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="font-semibold text-red-900">Unable to load courses</h3>
          <p className="mt-2 text-sm text-red-800">
            We're having trouble connecting to the database. Please try again in a moment, or contact support if the problem persists.
          </p>
          <p className="mt-2 text-xs text-red-700">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }
}

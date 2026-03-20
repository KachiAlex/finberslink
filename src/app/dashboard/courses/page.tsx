import { redirect } from "next/navigation";
import { Compass, GraduationCap } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { getStudentEnrollments } from "@/features/dashboard/service";
import { listLearnerCourses } from "@/features/lms/data/course-service";
import { DashboardCoursesClient } from "./dashboard-courses-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardCoursesPage() {
  const session = await requireSession({ failureMode: "error" });

  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const [enrollments, catalog] = await Promise.all([
    getStudentEnrollments(session.sub),
    listLearnerCourses(session.sub),
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

      <DashboardCoursesClient assigned={assigned} catalog={catalog} />
    </div>
  );
}

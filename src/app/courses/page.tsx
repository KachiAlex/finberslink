import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/features/lms/components/course-card";
import { listLearnerCourses } from "@/features/lms/data/course-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoursesPage() {
  const courses = await listLearnerCourses();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Learning marketplace
          </Badge>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                Courses & Cohorts
              </h1>
              <p className="text-lg text-slate-600">
                Blended programs led by mentors, AI-assisted practice, and collaborative communities.
              </p>
            </div>
            <div className="flex gap-3 text-sm text-slate-500">
              <span>Showing {courses.length} programs</span>
            </div>
          </div>
        </section>
        <section className="mt-10 grid gap-8 md:grid-cols-2">
          {courses.length === 0 ? (
            <p className="text-slate-500">No programs are available yet. Check back soon!</p>
          ) : (
            courses.map((course) => <CourseCard key={course.id} course={course} />)
          )}
        </section>
      </main>
    </div>
  );
}

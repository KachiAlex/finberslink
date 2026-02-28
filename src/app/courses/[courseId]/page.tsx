import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CourseHero } from "@/features/lms/components/course-hero";
import { LessonList } from "@/features/lms/components/lesson-list";
import { getLearnerCourseDetail } from "@/features/lms/data/course-service";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getLearnerCourseDetail(courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        <CourseHero course={course} />

        <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <Card className="border border-slate-200/80 bg-white/95">
            <CardContent className="space-y-6 p-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Course overview</h2>
                <p className="mt-2 text-slate-600">{course.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Outcomes</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {course.outcomes.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="border-0 bg-slate-100 text-slate-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white/95">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Support</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>Weekly live office hours with {course.instructor.name}</p>
                <p>Private cohort forum + tutor feedback threads</p>
                <p>Email alerts for new resources &amp; announcements</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
                Need extra help? Message mentors inside the lesson forum or book a 1:1 coaching slot.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Lesson flow</h2>
              <p className="text-slate-600">Track your modules, unlock live workshops, and revisit completed lessons.</p>
            </div>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              {course.lessonsCompleted}/{course.lessonsCount} lessons completed
            </Badge>
          </div>
          <LessonList courseId={course.id} lessons={course.lessons} />
        </section>
      </main>
    </div>
  );
}

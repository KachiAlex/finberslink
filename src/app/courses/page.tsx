import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/features/lms/components/course-card";
import { listLearnerCourses } from "@/features/lms/data/course-service";
import { GradientText, RippleButton, AnimatedCourseCard } from "@/components/shared/animated-components";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoursesPage() {
  const courses = await listLearnerCourses();
  const learningPathCourses = courses.slice(0, 4);
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

        {/* My Learning Path Section */}
        {courses.length > 0 && (
          <section className="mt-16 space-y-6 relative z-10">
            <div className="flex items-center justify-between group">
              <div>
                <h2 className="text-3xl font-bold transition-all duration-300">
                  <GradientText>My Learning Path</GradientText>
                </h2>
                <p className="mt-1 text-sm text-slate-600">Continue where you left off or start something new</p>
              </div>
            </div>

            {/* Course Cards Grid with Animation */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {learningPathCourses.map((course, idx) => (
                <AnimatedCourseCard 
                  key={course.id} 
                  title={course.name || course.title || 'Untitled Course'}
                  enrolled={course.enrollmentCount || 0}
                  rating={5}
                  delay={idx * 100}
                />
              ))}
            </div>

            {/* Enhanced Empty State */}
            {courses.length === 0 && (
              <div className="group rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-12 text-center transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 cursor-pointer relative overflow-hidden">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-300 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-300 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-200 group-hover:shadow-lg">
                  <BookOpen className="h-8 w-8 text-blue-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 transition-colors duration-300">No courses yet?</h3>
                <p className="text-slate-600 mb-6 transition-colors duration-300 group-hover:text-slate-700">Discover our comprehensive catalog and start your learning journey today.</p>
              </div>
            )}
          </section>
        )}

        {/* All Courses Section */}
        <section className="mt-16 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">All Programs</h2>
            <p className="text-slate-600">Browse our complete collection of courses</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {courses.length === 0 ? (
              <p className="text-slate-500">No programs are available yet. Check back soon!</p>
            ) : (
              courses.map((course) => <CourseCard key={course.id} course={course} />)
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

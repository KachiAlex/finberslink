import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, PenSquare, Users, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TutorPage() {
  const session = await requireSession({
    allowedRoles: ["TUTOR"],
    requireTenant: true,
    failureMode: "error",
  });

  let coursesCount = 0;
  let enrollmentsCount = 0;
  let lessonsCount = 0;

  // Do not crash the tutor page if production DB schema/data is temporarily inconsistent.
  try {
    const [courses, enrollments, lessons] = await Promise.all([
      prisma.course.count({ where: { instructorId: session.sub } }),
      prisma.enrollment.count({ where: { course: { instructorId: session.sub } } }),
      prisma.courseLesson.count({ where: { course: { instructorId: session.sub } } }),
    ]);

    coursesCount = courses;
    enrollmentsCount = enrollments;
    lessonsCount = lessons;
  } catch (error) {
    console.error("Tutor stats query failed:", error);
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center">
      <div className="mb-3 rounded-full bg-blue-50 p-2 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-medium text-slate-600">{title}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          <StatCard title="Courses" value={coursesCount} icon={BookOpen} />
          <StatCard title="Students" value={enrollmentsCount} icon={Users} />
          <StatCard title="Lessons" value={lessonsCount} icon={BarChart3} />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="h-12">
              <Link href="/tutor/courses/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Course
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12">
              <Link href="/tutor/courses">
                <BookOpen className="mr-2 h-5 w-5" />
                Manage Courses
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12">
              <Link href="/tutor/exams/new">
                <PenSquare className="mr-2 h-5 w-5" />
                Create Exam
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12">
              <Link href="/tutor/exams">
                <BarChart3 className="mr-2 h-5 w-5" />
                Manage Exams
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

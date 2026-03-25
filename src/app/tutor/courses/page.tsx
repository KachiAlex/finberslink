import { listTutorCourses } from "@/features/tutor/service";
import { requireSession } from "@/lib/auth/session";
import { CoursesTable } from "@/components/tutor/courses-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function TutorCourseFilterComponent() {
  const session = await requireSession({
    allowedRoles: ["TUTOR"],
    requireTenant: true,
    failureMode: "error",
  });

  let courses = [];
  let error: unknown = null;

  try {
    courses = await listTutorCourses(session.sub);
  } catch (err) {
    console.error("Failed to load tutor courses:", err);
    error = err;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
        <p className="font-semibold">Failed to load courses</p>
        <p className="text-sm">Please refresh the page or contact support if the problem persists.</p>
      </div>
    );
  }

  return (
    <CoursesTable
      courses={courses.map((course) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        tagline: course.tagline,
        category: course.category,
        level: course.level,
        approvalStatus: course.approvalStatus,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        tutorEditingLocked: course.tutorEditingLocked,
        enrollmentCount: course.enrollmentCount,
      }))}
    />
  );
}

export default async function TutorCoursesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Course Management</h1>
          <p className="text-slate-600 mt-2">
            View all your courses, edit drafts, and track approval status from admins.
          </p>
        </div>

        <TutorCourseFilterComponent />
      </div>
    </main>
  );
}

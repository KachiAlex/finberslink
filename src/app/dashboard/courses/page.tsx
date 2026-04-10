import { requireSession } from "@/lib/auth/session";
import { CoursesTab } from "@/components/dashboard/courses/courses-tab";

export const metadata = {
  title: "Courses | Dashboard",
  description: "Discover, manage, and track your learning courses",
};

export default async function CoursesPage() {
  await requireSession({
    allowedRoles: ["STUDENT"],
    failureMode: "redirect",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
        <p className="text-slate-600 mt-2">
          Discover new courses, manage assignments, and track your learning progress
        </p>
      </div>

      <CoursesTab />
    </div>
  );
}

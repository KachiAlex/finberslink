"use client";

import { useRouter } from "next/navigation";
import { CoursesTable, TutorCourse } from "@/components/tutor/courses-table";
import { Button } from "../../../components/ui/button";

interface CoursesPageClientProps {
  initialCourses: TutorCourse[];
}

export function CoursesPageClient({ initialCourses }: CoursesPageClientProps) {
  const router = useRouter();

  const handleCourseCreated = () => {
    // Simply refresh the page to get updated data from server
    router.refresh();
  };

  const testDebugEndpoint = async () => {
    try {
      const response = await fetch("/api/tutor/courses/debug");
      const data = await response.json();
      console.log("Debug endpoint response:", data);
      alert(`Debug Info: Found ${data.totalCount} courses. Check console for details.`);
    } catch (error) {
      console.error("Debug endpoint error:", error);
      alert("Debug endpoint failed - check console");
    }
  };

  const handleDebugRegularCourses = async () => {
    try {
      const response = await fetch("/api/tutor/courses/debug-regular");
      const data = await response.json();
      console.log("Debug regular vs archived response:", data);
      alert(`Regular Courses: ${data.regularCoursesCount}, Archived: ${data.archivedCoursesCount}. Check console for details.`);
    } catch (error) {
      console.error("Debug regular vs archived error:", error);
      alert("Debug endpoint failed - check console");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Course Management</h1>
            <p className="text-slate-600 mt-2">
              View all your courses, edit drafts, and track approval status from admins.
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Currently showing {initialCourses.length} courses from server.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testDebugEndpoint}
            >
              Debug Courses
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDebugRegularCourses}
            >
              Debug Regular vs Archived
            </Button>
          </div>
        </div>

        <CoursesTable 
          courses={initialCourses}
          onCourseCreated={handleCourseCreated}
        />
      </div>
    </main>
  );
}

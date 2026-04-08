"use client";

import { CoursesTable, TutorCourse } from "@/components/tutor/courses-table";
import { useRouter } from "next/navigation";

interface CoursesTableClientProps {
  initialCourses: TutorCourse[];
}

export function CoursesTableClient({ initialCourses }: CoursesTableClientProps) {
  const router = useRouter();

  const handleCourseCreated = () => {
    // Simply refresh the page to get updated data
    router.refresh();
  };

  return (
    <CoursesTable 
      courses={initialCourses}
      onCourseCreated={handleCourseCreated}
    />
  );
}

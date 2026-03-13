// Course service - Firestore implementation pending
// LMS/Course model not yet migrated to Firestore

import type { CourseDetail, CourseSummary, Lesson } from "@/types/lms";

const DEFAULT_LEARNER_ID = process.env.NEXT_PUBLIC_DEMO_STUDENT_ID ?? "user_student";

export async function listLearnerCourses(_userId = DEFAULT_LEARNER_ID): Promise<CourseSummary[]> {
  // Placeholder - will be implemented after migration
  return [];
}

export async function getLearnerCourseDetail(
  slug: string,
  _userId = DEFAULT_LEARNER_ID,
): Promise<CourseDetail | null> {
  // Placeholder - will be implemented after migration
  return null;
}

export async function getLearnerLesson(
  courseSlug: string,
  lessonSlug: string,
  _userId = DEFAULT_LEARNER_ID,
): Promise<{ course: CourseDetail; lesson: Lesson } | null> {
  // Placeholder - will be implemented after migration
  return null;
}

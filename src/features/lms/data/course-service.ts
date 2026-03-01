// Course service - Firestore implementation pending
// LMS/Course model not yet migrated to Firestore

import type { CourseDetail, CourseSummary, Lesson, Resource } from "@/types/lms";

const DEFAULT_LEARNER_ID = process.env.NEXT_PUBLIC_DEMO_STUDENT_ID ?? "user_student";
const DEFAULT_INSTRUCTOR_AVATAR =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

export async function listLearnerCourses(userId = DEFAULT_LEARNER_ID): Promise<CourseSummary[]> {
  // Placeholder - will be implemented after migration
  return [];
}

export async function getLearnerCourseDetail(
  slug: string,
  userId = DEFAULT_LEARNER_ID,
): Promise<CourseDetail | null> {
  // Placeholder - will be implemented after migration
  return null;
}

export async function getLearnerLesson(
  courseSlug: string,
  lessonSlug: string,
  userId = DEFAULT_LEARNER_ID,
): Promise<{ course: CourseDetail; lesson: Lesson } | null> {
  // Placeholder - will be implemented after migration
  return null;
}

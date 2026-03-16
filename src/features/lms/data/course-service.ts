import type { CourseLevel as PrismaCourseLevel } from "@prisma/client";

import type { CourseDetail, CourseSummary, Lesson } from "@/types/lms";
import { prisma } from "@/lib/prisma";

const DEFAULT_LEARNER_ID = process.env.NEXT_PUBLIC_DEMO_STUDENT_ID ?? "user_student";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?auto=format&fit=crop&w=400&q=80";

const prismaLevelToSummary = (level: PrismaCourseLevel): CourseSummary["level"] => {
  switch (level) {
    case "INTERMEDIATE":
      return "intermediate";
    case "ADVANCED":
      return "advanced";
    default:
      return "beginner";
  }
};

export async function listLearnerCourses(_userId = DEFAULT_LEARNER_ID): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    where: {
      approvalStatus: "APPROVED",
      instructor: {
        role: { in: ["TUTOR", "ADMIN", "SUPER_ADMIN"] },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          profile: {
            select: {
              headline: true,
            },
          },
        },
      },
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  return courses.map<CourseSummary>((course) => ({
    id: course.id,
    title: course.title,
    tagline: course.tagline,
    level: prismaLevelToSummary(course.level as PrismaCourseLevel),
    category: course.category,
    coverImage: course.coverImage,
    progressPercentage: 0,
    lessonsCompleted: 0,
    lessonsCount: course._count.lessons,
    instructor: {
      id: course.instructor?.id ?? "unknown",
      name: course.instructor
        ? `${course.instructor.firstName} ${course.instructor.lastName}`.trim()
        : "Finbers Instructor",
      title: course.instructor?.profile?.headline ?? "Lead instructor",
      avatarUrl: course.instructor?.avatarUrl ?? FALLBACK_AVATAR,
    },
  }));
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

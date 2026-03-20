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
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: slug }, { slug }],
      approvalStatus: "APPROVED",
    },
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
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          format: true,
          summary: true,
          content: true,
          videoUrl: true,
          resources: {
            select: {
              id: true,
              title: true,
              type: true,
              url: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  const lessonsCompleted = 0; // Placeholder until learner progress tracking lands

  const courseDetail: CourseDetail = {
    id: course.id,
    title: course.title,
    tagline: course.tagline,
    level: prismaLevelToSummary(course.level as PrismaCourseLevel),
    category: course.category,
    coverImage: course.coverImage,
    progressPercentage: lessonsCompleted && course.lessons.length
      ? Math.round((lessonsCompleted / course.lessons.length) * 100)
      : 0,
    lessonsCompleted,
    lessonsCount: course.lessons.length,
    instructor: {
      id: course.instructor?.id ?? "unknown",
      name: course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}`.trim() : "Finbers Instructor",
      title: course.instructor?.profile?.headline ?? "Lead instructor",
      avatarUrl: course.instructor?.avatarUrl ?? FALLBACK_AVATAR,
    },
    description: course.description,
    outcomes: course.outcomes,
    skills: course.skills,
    certificateAvailable: course.certificateAvailable,
    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      format: lesson.format.toLowerCase() as Lesson["format"],
      status: "available",
      summary: lesson.summary,
      resources: lesson.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type.toLowerCase() as Lesson["resources"][number]["type"],
        url: resource.url,
      })),
      content: lesson.content ?? undefined,
      videoUrl: lesson.videoUrl ?? undefined,
    })),
  };

  return courseDetail;
}

export async function getLearnerLesson(
  courseSlug: string,
  lessonSlug: string,
  _userId = DEFAULT_LEARNER_ID,
): Promise<{ course: CourseDetail; lesson: Lesson } | null> {
  // Placeholder - will be implemented after migration
  return null;
}

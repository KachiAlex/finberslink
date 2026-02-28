import { LessonProgressStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CourseDetail, CourseSummary, Lesson, Resource } from "@/types/lms";

const DEFAULT_LEARNER_ID = process.env.NEXT_PUBLIC_DEMO_STUDENT_ID ?? "user_student";
const DEFAULT_INSTRUCTOR_AVATAR =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

type CourseWithLearnerContext = Prisma.CourseGetPayload<{
  include: {
    instructor: { include: { profile: true } };
    lessons: { include: { resources: true }; orderBy: { order: "asc" } };
    enrollments: { include: { lessonProgress: true } };
  };
}>;

type LessonState = {
  lessons: Lesson[];
  lessonsCompleted: number;
  lessonsCount: number;
  nextLessonId?: string;
};

export async function listLearnerCourses(userId = DEFAULT_LEARNER_ID): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: baseCourseInclude(userId),
  });

  return courses.map((course) => toCourseSummary(mapCourseDetail(course, userId)));
}

export async function getLearnerCourseDetail(
  slug: string,
  userId = DEFAULT_LEARNER_ID,
): Promise<CourseDetail | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: baseCourseInclude(userId),
  });

  if (!course) {
    return null;
  }

  return mapCourseDetail(course, userId);
}

export async function getLearnerLesson(
  courseSlug: string,
  lessonSlug: string,
  userId = DEFAULT_LEARNER_ID,
): Promise<{ course: CourseDetail; lesson: Lesson } | null> {
  const courseDetail = await getLearnerCourseDetail(courseSlug, userId);
  if (!courseDetail) {
    return null;
  }

  const lesson = courseDetail.lessons.find((item) => item.id === lessonSlug);
  if (!lesson) {
    return null;
  }

  return { course: courseDetail, lesson };
}

function baseCourseInclude(userId: string) {
  return {
    instructor: { include: { profile: true } },
    lessons: { orderBy: { order: "asc" }, include: { resources: true } },
    enrollments: {
      where: { userId },
      include: { lessonProgress: true },
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  } satisfies Prisma.CourseInclude;
}

function mapCourseDetail(course: CourseWithLearnerContext, userId: string): CourseDetail {
  const enrollment = course.enrollments.find((item) => item.userId === userId);
  const { lessons, lessonsCompleted, lessonsCount, nextLessonId } = buildLessonState(course, enrollment);

  const progressPercentage = enrollment?.progressPercentage ?? calculateProgressPercentage(lessonsCompleted, lessonsCount);
  const instructorProfile = course.instructor.profile;
  const instructorName = [course.instructor.firstName, course.instructor.lastName].filter(Boolean).join(" ") || "Finbers Tutor";

  return {
    id: course.slug,
    title: course.title,
    tagline: course.tagline,
    level: course.level.toLowerCase() as CourseDetail["level"],
    category: course.category,
    coverImage: course.coverImage,
    progressPercentage,
    lessonsCompleted,
    lessonsCount,
    nextLessonId,
    instructor: {
      id: course.instructor.id,
      name: instructorName,
      title: instructorProfile?.headline ?? "Finbers Mentor",
      avatarUrl: course.instructor.avatarUrl ?? DEFAULT_INSTRUCTOR_AVATAR,
    },
    description: course.description,
    outcomes: course.outcomes,
    skills: course.skills,
    lessons,
    certificateAvailable: course.certificateAvailable,
  };
}

function toCourseSummary(course: CourseDetail): CourseSummary {
  const { description: _description, outcomes: _outcomes, skills: _skills, lessons, certificateAvailable, ...summary } = course;
  return summary;
}

function buildLessonState(course: CourseWithLearnerContext, enrollment?: CourseWithLearnerContext["enrollments"][number]): LessonState {
  const progressEntries = enrollment?.lessonProgress ?? [];
  const progressByLessonId = new Map(progressEntries.map((entry) => [entry.lessonId, entry.status]));
  const completedLessonIds = new Set(
    progressEntries.filter((entry) => entry.status === LessonProgressStatus.COMPLETED).map((entry) => entry.lessonId),
  );

  const highestCompletedOrder = course.lessons.reduce((max, lesson) => {
    if (completedLessonIds.has(lesson.id)) {
      return Math.max(max, lesson.order);
    }
    return max;
  }, 0);

  const nextUnlockedOrder = highestCompletedOrder > 0 ? highestCompletedOrder + 1 : 1;

  const lessons = course.lessons.map((lesson) => {
    const progressStatus = progressByLessonId.get(lesson.id);
    let status: Lesson["status"];

    if (progressStatus === LessonProgressStatus.COMPLETED) {
      status = "completed";
    } else if (progressStatus) {
      status = "available";
    } else if (lesson.order === nextUnlockedOrder) {
      status = "available";
    } else if (lesson.order === 1 && nextUnlockedOrder === 1) {
      status = "available";
    } else {
      status = "locked";
    }

    return {
      id: lesson.slug,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      format: lesson.format.toLowerCase() as Lesson["format"],
      status,
      summary: lesson.summary,
      content: lesson.content ?? undefined,
      videoUrl: lesson.videoUrl ?? undefined,
      resources: lesson.resources.map(toResourceDTO),
    } satisfies Lesson;
  });

  const lessonsCompleted = lessons.filter((lesson) => lesson.status === "completed").length;
  const lessonsCount = lessons.length;
  const nextLessonId = lessons.find((lesson) => lesson.status === "available")?.id ?? lessons[0]?.id;

  return { lessons, lessonsCompleted, lessonsCount, nextLessonId };
}

function toResourceDTO(resource: { id: string; title: string; type: string; url: string }): Resource {
  return {
    id: resource.id,
    title: resource.title,
    type: resource.type.toLowerCase() as Resource["type"],
    url: resource.url,
  };
}

function calculateProgressPercentage(completed: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

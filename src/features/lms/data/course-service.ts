import type { CourseLevel as PrismaCourseLevel, Prisma } from "@prisma/client";

import type { CourseDetail, CourseSummary, Lesson } from "@/types/lms";
import { prisma } from "@/lib/prisma";

const DEFAULT_LEARNER_ID = process.env.NEXT_PUBLIC_DEMO_STUDENT_ID ?? "user_student";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?auto=format&fit=crop&w=400&q=80";

type LearnerLevelFilter = "beginner" | "intermediate" | "advanced";

const COURSES_PAGE_SIZE = 6;

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

const summaryLevelToPrisma = (level: LearnerLevelFilter): PrismaCourseLevel => {
  switch (level) {
    case "intermediate":
      return "INTERMEDIATE";
    case "advanced":
      return "ADVANCED";
    default:
      return "BEGINNER";
  }
};

const instructorSelect = {
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
} satisfies Prisma.UserArgs;

const courseSummaryInclude = {
  instructor: instructorSelect,
  _count: {
    select: {
      lessons: true,
      enrollments: true,
    },
  },
} satisfies Prisma.CourseInclude;

const courseDetailInclude = {
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
      slug: true,
      order: true,
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
} satisfies Prisma.CourseInclude;

type CourseSummaryRecord = Prisma.CourseGetPayload<{ include: typeof courseSummaryInclude }>;

const mapCourseToSummary = (course: CourseSummaryRecord): CourseSummary => ({
  id: course.id,
  title: course.title,
  tagline: course.tagline,
  level: prismaLevelToSummary(course.level as PrismaCourseLevel),
  category: course.category,
  coverImage: course.coverImage,
  progressPercentage: 0,
  lessonsCompleted: 0,
  lessonsCount: course._count?.lessons ?? 0,
  instructor: {
    id: course.instructor?.id ?? "unknown",
    name: course.instructor
      ? `${course.instructor.firstName} ${course.instructor.lastName}`.trim()
      : "Finbers Instructor",
    title: course.instructor?.profile?.headline ?? "Lead instructor",
    avatarUrl: course.instructor?.avatarUrl ?? FALLBACK_AVATAR,
  },
});

interface DashboardCatalogOptions {
  search?: string;
  category?: string;
  level?: LearnerLevelFilter;
  sort?: "recent" | "popular";
  page?: number;
  pageSize?: number;
}

export async function listDashboardCatalogCourses(options: DashboardCatalogOptions = {}) {
  const {
    search,
    category,
    level,
    sort = "recent",
    page = 1,
    pageSize = COURSES_PAGE_SIZE,
  } = options;

  const take = Math.min(Math.max(pageSize, 1), 24);
  const requestedPage = Math.max(page, 1);

  const where: Prisma.CourseWhereInput = {
    approvalStatus: "APPROVED",
    archivedAt: null,
    AND: [
      {
        OR: [
          // Courses from ADMIN or SUPER_ADMIN instructors
          {
            instructor: {
              role: { in: ["ADMIN", "SUPER_ADMIN"] },
            },
          },
          // Courses from approved TUTOR instructors
          {
            AND: [
              {
                instructor: {
                  role: "TUTOR",
                },
              },
              {
                instructor: {
                  tutorApprovalAsStudent: {
                    some: {
                      status: "APPROVED",
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  };

  if (search?.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { tagline: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (level) {
    where.level = summaryLevelToPrisma(level);
  }

  const orderBy: Prisma.CourseOrderByWithRelationInput =
    sort === "popular"
      ? { enrollments: { _count: "desc" } }
      : { createdAt: "desc" };

  const total = await prisma.course.count({ where });
  const totalPages = Math.max(Math.ceil(total / take), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * take;

  const courses = await prisma.course.findMany({
    where,
    skip,
    take,
    orderBy,
    include: courseSummaryInclude,
  });

  return {
    courses: courses.map(mapCourseToSummary),
    pagination: {
      page: currentPage,
      pageSize: take,
      total,
      totalPages,
    },
  };
}

export async function listLearnerCourses(_userId = DEFAULT_LEARNER_ID): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    where: {
      approvalStatus: "APPROVED",
      archivedAt: null,
      AND: [
        {
          OR: [
            // Courses from ADMIN or SUPER_ADMIN instructors
            {
              instructor: {
                role: { in: ["ADMIN", "SUPER_ADMIN"] },
              },
            },
            // Courses from approved TUTOR instructors
            {
              AND: [
                {
                  instructor: {
                    role: "TUTOR",
                  },
                },
                {
                  instructor: {
                    tutorApprovalAsStudent: {
                      some: {
                        status: "APPROVED",
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: courseSummaryInclude,
  });

  return courses.map(mapCourseToSummary);
}

export async function getLearnerCourseDetail(
  slug: string,
  userId = DEFAULT_LEARNER_ID,
): Promise<CourseDetail | null> {
  const matchedCourse = await prisma.course.findFirst({
    where: {
      OR: [{ id: slug }, { slug }],
    },
    select: {
      id: true,
      approvalStatus: true,
      archivedAt: true,
    },
  });

  if (!matchedCourse) {
    return null;
  }

  const canAccessApprovedCourse =
    matchedCourse.approvalStatus === "APPROVED" && matchedCourse.archivedAt === null;

  if (!canAccessApprovedCourse) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: matchedCourse.id,
      },
      select: { courseId: true },
    });

    if (!enrollment) {
      return null;
    }
  }

  const course = await prisma.course.findUnique({
    where: { id: matchedCourse.id },
    include: courseDetailInclude,
  });

  if (!course) {
    console.error("[course-detail] matched course id no longer exists", {
      userId,
      requestedSlug: slug,
      courseId: matchedCourse.id,
    });
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
  const matchedCourse = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseSlug }, { slug: courseSlug }],
    },
    select: { id: true },
  });

  if (!matchedCourse) {
    return null;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: _userId,
      courseId: matchedCourse.id,
    },
    select: {
      courseId: true,
      lessonProgress: {
        select: {
          lessonId: true,
          status: true,
        },
      },
    },
  });

  if (!enrollment) {
    return null;
  }

  const courseRecord = await prisma.course.findUnique({
    where: { id: enrollment.courseId },
    include: {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          profile: { select: { headline: true } },
        },
      },
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          order: true,
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

  if (!courseRecord) {
    console.error("[course-lesson] enrollment references missing course", {
      userId: _userId,
      courseId: enrollment.courseId,
    });
    return null;
  }

  const rawLesson = courseRecord.lessons.find((lesson) => lesson.id === lessonSlug || lesson.slug === lessonSlug);

  if (!rawLesson) {
    return null;
  }

  const progressMap = new Map(enrollment.lessonProgress.map((progress) => [progress.lessonId, progress.status]));

  let previousLessonsUnlocked = true;
  let lessonsCompleted = 0;

  const mappedLessons: Lesson[] = courseRecord.lessons.map((lesson) => {
    const progressStatus = progressMap.get(lesson.id);
    let status: Lesson["status"] = "locked";

    if (progressStatus === "COMPLETED") {
      status = "completed";
      lessonsCompleted += 1;
      previousLessonsUnlocked = true;
    } else if (progressStatus === "IN_PROGRESS") {
      status = "available";
      previousLessonsUnlocked = false;
    } else if (progressStatus === "NOT_STARTED") {
      status = previousLessonsUnlocked ? "available" : "locked";
      previousLessonsUnlocked = false;
    } else {
      status = previousLessonsUnlocked ? "available" : "locked";
      previousLessonsUnlocked = status === "available";
    }

    return {
      id: lesson.id,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      format: lesson.format.toLowerCase() as Lesson["format"],
      status,
      summary: lesson.summary,
      resources: lesson.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type.toLowerCase() as Lesson["resources"][number]["type"],
        url: resource.url,
      })),
      content: lesson.content ?? undefined,
      videoUrl: lesson.videoUrl ?? undefined,
    };
  });

  const lessonsCount = mappedLessons.length;
  const progressPercentage = lessonsCount === 0 ? 0 : Math.round((lessonsCompleted / lessonsCount) * 100);

  const courseDetail: CourseDetail = {
    id: courseRecord.id,
    title: courseRecord.title,
    tagline: courseRecord.tagline,
    level: prismaLevelToSummary(courseRecord.level as PrismaCourseLevel),
    category: courseRecord.category,
    coverImage: courseRecord.coverImage,
    progressPercentage,
    lessonsCompleted,
    lessonsCount,
    instructor: {
      id: courseRecord.instructor?.id ?? "unknown",
      name: courseRecord.instructor
        ? `${courseRecord.instructor.firstName} ${courseRecord.instructor.lastName}`.trim()
        : "Finbers Instructor",
      title: courseRecord.instructor?.profile?.headline ?? "Lead instructor",
      avatarUrl: courseRecord.instructor?.avatarUrl ?? FALLBACK_AVATAR,
    },
    description: courseRecord.description,
    outcomes: courseRecord.outcomes,
    skills: courseRecord.skills,
    certificateAvailable: courseRecord.certificateAvailable,
    lessons: mappedLessons,
  };

  const mappedLesson = mappedLessons.find((lesson) => lesson.id === rawLesson.id);

  if (mappedLesson && mappedLesson.status === "locked") {
    mappedLesson.status = "available";
  }

  if (!mappedLesson) {
    return null;
  }

  return { course: courseDetail, lesson: mappedLesson };
}

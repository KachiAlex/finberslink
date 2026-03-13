import { CourseLevel, ExamStatus, ExamType, LessonFormat, Prisma, ResourceType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export type PendingForumPost = {
  id: string;
  title: string;
  author?: { firstName?: string | null; lastName?: string | null } | null;
  course?: { title?: string | null } | null;
};

export type TutorOfficeHourSession = {
  id: string;
  startTime: Date | string;
  bookings: { id: string }[];
};

export type TutorExam = {
  id: string;
  title: string;
  target: string;
  status: ExamStatus;
  updatedAt: string;
};

export type TutorCohort = {
  id: string;
  title: string;
  category: string | null;
  slug: string;
  lessons: { id: string }[];
  enrollments: { id: string }[];
};

export async function getTutorCohorts(tutorId: string): Promise<TutorCohort[]> {
  const courses = await prisma.course.findMany({
    where: { instructorId: tutorId },
    select: {
      id: true,
      title: true,
      category: true,
      slug: true,
      lessons: { select: { id: true } },
      enrollments: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((course) => ({
    ...course,
    lessons: course.lessons ?? [],
    enrollments: course.enrollments ?? [],
  }));
}

export async function getPendingForumPosts(_tutorId: string): Promise<PendingForumPost[]> {
  // TODO: Implement once forum moderation endpoints are wired.
  return [];
}

export async function getTutorOfficeHours(_tutorId: string): Promise<TutorOfficeHourSession[]> {
  // TODO: Implement OfficeHour model and fetch upcoming sessions.
  return [];
}

export type ForumThreadWithFlags = Prisma.ForumThreadGetPayload<{
  include: {
    course: { select: { id: true; title: true } };
    author: { select: { firstName: true; lastName: true } };
    _count: { select: { posts: true } };
  };
}> & { unread?: boolean; mentions?: boolean };

export async function getTutorForumThreads(tutorId: string, limit = 5, search?: string) {
  const threads = await prisma.forumThread.findMany({
    where: {
      course: { instructorId: tutorId },
      ...(search
        ? {
            title: { contains: search, mode: "insensitive" },
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      course: { select: { id: true, title: true } },
      author: { select: { firstName: true, lastName: true } },
      _count: { select: { posts: true } },
      reads: { where: { userId: tutorId }, select: { lastReadAt: true } },
      mentions: { where: { userId: tutorId }, select: { id: true } },
    },
  });

  return threads.map((thread) => {
    const { reads, mentions, ...rest } = thread;
    const unread = (reads?.length ?? 0) === 0;
    const hasMentions = (mentions?.length ?? 0) > 0;
    return { ...rest, unread, mentions: hasMentions } as ForumThreadWithFlags;
  });
}

export async function listTutorExams(tutorId: string) {
  const exams = await prisma.exam.findMany({
    where: { createdById: tutorId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
      sectionLabel: true,
      updatedAt: true,
    },
  });

  return exams.map((exam) => ({
    ...exam,
    target: exam.type === "FINAL" ? "Final exam" : `Section: ${exam.sectionLabel ?? "Section"}`,
    updatedAt: exam.updatedAt.toISOString(),
  }));
}

export { ExamType } from "@prisma/client";

type CreateExamInput = {
  tutorId: string;
  courseId: string;
  type: ExamType;
  sectionId?: string | null;
  sectionLabel?: string | null;
  title: string;
  description?: string | null;
  passingScore?: number | null;
  timeLimit?: number | null;
  modules?: Prisma.InputJsonValue;
};

export async function createTutorExam(input: CreateExamInput) {
  return prisma.exam.create({
    data: {
      courseId: input.courseId,
      createdById: input.tutorId,
      type: input.type,
      status: ExamStatus.DRAFT,
      title: input.title,
      description: input.description,
      sectionId: input.sectionId ?? null,
      sectionLabel: input.sectionLabel ?? null,
      passingScore: input.passingScore ?? null,
      timeLimit: input.timeLimit ?? null,
      modules: (input.modules ?? []) as Prisma.InputJsonValue,
    },
  });
}

export async function submitTutorExam(examId: string, tutorId: string) {
  // Ensure the tutor owns this exam
  const exam = await prisma.exam.findFirst({ where: { id: examId, createdById: tutorId } });
  if (!exam) {
    throw new Error("Exam not found or access denied");
  }
  return prisma.exam.update({
    where: { id: examId },
    data: { status: ExamStatus.SUBMITTED, updatedAt: new Date() },
  });
}

type TutorCourseResourceInput = {
  title: string;
  type: ResourceType;
  url: string;
};

type TutorCourseModuleInput = {
  title: string;
  format: LessonFormat;
  durationMinutes: number;
  summary?: string;
  content?: string;
  videoUrl?: string | null;
  resources?: TutorCourseResourceInput[];
};

type TutorExamConfigInput = {
  title: string;
  description?: string | null;
  passingScore?: number | null;
  timeLimit?: number | null;
  modules: Prisma.InputJsonValue;
};

type TutorCourseSectionInput = {
  title: string;
  order: number;
  modules: TutorCourseModuleInput[];
  exam?: TutorExamConfigInput;
};

export type TutorCourseCreationInput = {
  tutorId: string;
  coverImage: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  level: CourseLevel;
  outcomes?: string[];
  skills?: string[];
  sections: TutorCourseSectionInput[];
  finalExam?: TutorExamConfigInput;
};

export async function createTutorCourseWithAssessments(input: TutorCourseCreationInput) {
  const normalizedSlug = slugify(input.slug || input.title);
  if (!normalizedSlug) {
    throw new Error("Invalid slug");
  }

  const existing = await prisma.course.findUnique({ where: { slug: normalizedSlug } });
  if (existing) {
    throw new Error("Course slug already in use");
  }

  if (!input.sections.length) {
    throw new Error("At least one section is required");
  }

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        slug: normalizedSlug,
        title: input.title,
        tagline: input.tagline,
        description: input.description,
        category: input.category,
        level: input.level,
        coverImage: input.coverImage,
        instructorId: input.tutorId,
        outcomes: input.outcomes ?? [],
        skills: input.skills ?? [],
      },
    });

    let lessonOrder = 1;
    for (const section of input.sections) {
      for (const lessonModule of section.modules) {
        const lesson = await tx.lesson.create({
          data: {
            courseId: course.id,
            title: lessonModule.title,
            slug: slugify(`${section.title}-${lessonModule.title}-${lessonOrder}`),
            order: lessonOrder++,
            durationMinutes: lessonModule.durationMinutes || 0,
            format: lessonModule.format,
            summary: lessonModule.summary ?? "",
            content: lessonModule.content ?? "",
            videoUrl: lessonModule.videoUrl ?? null,
          },
        });

        if (lessonModule.resources?.length) {
          await tx.lessonResource.createMany({
            data: lessonModule.resources.map((resource) => ({
              lessonId: lesson.id,
              title: resource.title,
              type: resource.type,
              url: resource.url,
            })),
          });
        }
      }

      if (section.exam) {
        await tx.exam.create({
          data: {
            courseId: course.id,
            createdById: input.tutorId,
            type: ExamType.SECTION,
            status: ExamStatus.DRAFT,
            title: section.exam.title,
            description: section.exam.description ?? null,
            sectionLabel: section.title,
            passingScore: section.exam.passingScore ?? null,
            timeLimit: section.exam.timeLimit ?? null,
            modules: section.exam.modules,
          },
        });
      }
    }

    if (input.finalExam) {
      await tx.exam.create({
        data: {
          courseId: course.id,
          createdById: input.tutorId,
          type: ExamType.FINAL,
          status: ExamStatus.DRAFT,
          title: input.finalExam.title,
          description: input.finalExam.description ?? null,
          passingScore: input.finalExam.passingScore ?? null,
          timeLimit: input.finalExam.timeLimit ?? null,
          modules: input.finalExam.modules,
        },
      });
    }

    return course;
  });
}

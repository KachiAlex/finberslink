import { CourseApprovalStatus, CourseLevel, ExamStatus, ExamType, LessonFormat, Prisma, ResourceType } from "@prisma/client";

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

export type TutorCourseModuleInput = {
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

export type TutorCourseSectionInput = {
  title: string;
  order: number;
  modules: TutorCourseModuleInput[];
  exam?: TutorExamConfigInput;
};

export type TutorCourseDraftInput = {
  tutorId: string;
  coverImage?: string;
  title?: string;
  slug?: string;
  tagline?: string;
  description?: string;
  category?: string;
  level?: CourseLevel;
  outcomes?: string[];
  skills?: string[];
  sections?: TutorCourseSectionInput[];
  finalExam?: TutorExamConfigInput;
  draftStructure?: Prisma.InputJsonValue;
};

const normalizeSlug = (candidate?: string, fallback?: string) => {
  const normalized = slugify(candidate || fallback || "");
  return normalized || undefined;
};

export async function upsertTutorCourseDraft(courseId: string | null, input: TutorCourseDraftInput) {
  console.log("Creating/updating course draft:", { courseId, tutorId: input.tutorId, title: input.title });
  
  const slug = normalizeSlug(input.slug, input.title);
  if (!courseId && !slug) {
    throw new Error("Slug or title required to create draft");
  }

  if (!courseId && slug) {
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      throw new Error("Course slug already in use");
    }
  }

  const baseData: Partial<Prisma.CourseUncheckedCreateInput> = {
    title: input.title,
    slug,
    tagline: input.tagline,
    description: input.description,
    category: input.category,
    level: input.level,
    coverImage: input.coverImage,
    outcomes: input.outcomes,
    skills: input.skills,
    approvalStatus: CourseApprovalStatus.DRAFT,
    tutorEditingLocked: false,
    draftStructure: input.draftStructure ?? Prisma.JsonNull,
  };

  if (!courseId) {
    console.log("Creating new course with data:", { ...baseData, instructorId: input.tutorId });
    
    const course = await prisma.course.create({
      data: {
        ...baseData,
        slug: slug!,
        title: input.title!,
        tagline: input.tagline!,
        description: input.description!,
        category: input.category!,
        level: input.level!,
        coverImage: input.coverImage!,
        outcomes: input.outcomes ?? [],
        skills: input.skills ?? [],
        instructorId: input.tutorId,
      },
    });

    console.log("Course created successfully:", course.id);
    await replaceCourseStructure(course.id, input.sections ?? [], input.finalExam, input.tutorId);
    return course;
  }

  const course = await prisma.course.findFirst({ where: { id: courseId, instructorId: input.tutorId } });
  if (!course) {
    throw new Error("Course not found");
  }

  await prisma.course.update({
    where: { id: course.id },
    data: {
      ...baseData,
      outcomes: input.outcomes ?? course.outcomes,
      skills: input.skills ?? course.skills,
      draftStructure: input.draftStructure !== undefined ? input.draftStructure : (course.draftStructure ?? Prisma.JsonNull),
    },
  });

  if (input.sections) {
    await replaceCourseStructure(course.id, input.sections, input.finalExam, input.tutorId, true);
  }

  return prisma.course.findUnique({ where: { id: course.id } });
}

async function replaceCourseStructure(
  courseId: string,
  sections: TutorCourseSectionInput[],
  finalExam: TutorExamConfigInput | undefined,
  tutorId: string,
  clearExisting = false,
) {
  await prisma.$transaction(async (tx) => {
    if (clearExisting) {
      await tx.lessonResource.deleteMany({ where: { lesson: { courseId } } });
      await tx.lesson.deleteMany({ where: { courseId } });
      await tx.exam.deleteMany({ where: { courseId } });
    }

    let lessonOrder = 1;
    for (const section of sections ?? []) {
      for (const lessonModule of section.modules ?? []) {
        const lesson = await tx.lesson.create({
          data: {
            courseId,
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
            courseId,
            createdById: tutorId,
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

    if (finalExam) {
      await tx.exam.create({
        data: {
          courseId,
          createdById: tutorId,
          type: ExamType.FINAL,
          status: ExamStatus.DRAFT,
          title: finalExam.title,
          description: finalExam.description ?? null,
          passingScore: finalExam.passingScore ?? null,
          timeLimit: finalExam.timeLimit ?? null,
          modules: finalExam.modules,
        },
      });
    }
  });
}

export async function submitTutorCourse(courseId: string, tutorId: string) {
  const course = await prisma.course.findFirst({ where: { id: courseId, instructorId: tutorId, archivedAt: null } });
  if (!course) {
    throw new Error("Course not found");
  }

  if (course.approvalStatus !== CourseApprovalStatus.DRAFT && course.approvalStatus !== CourseApprovalStatus.CHANGES) {
    throw new Error("Only drafts can be submitted");
  }

  if (!course.slug || !course.title || !course.tagline || !course.description || !course.category || !course.level || !course.coverImage) {
    throw new Error("Complete course basics before submission");
  }

  const lessonCount = await prisma.lesson.count({ where: { courseId: course.id } });
  if (lessonCount === 0) {
    throw new Error("Add at least one lesson before submission");
  }

  return prisma.course.update({
    where: { id: course.id },
    data: {
      approvalStatus: CourseApprovalStatus.PENDING,
      tutorEditingLocked: true,
    },
  });
}

export async function listTutorCourses(tutorId: string) {
  console.log("Fetching courses for tutor:", tutorId);
  
  const courses = await prisma.course.findMany({
    where: { instructorId: tutorId, archivedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      tagline: true,
      category: true,
      level: true,
      approvalStatus: true,
      tutorEditingLocked: true,
      hasPendingEdit: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${courses.length} courses for tutor ${tutorId}:`, courses.map(c => ({ id: c.id, title: c.title, approvalStatus: c.approvalStatus })));

  return courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    tagline: course.tagline,
    category: course.category,
    level: course.level,
    approvalStatus: course.approvalStatus,
    tutorEditingLocked: course.tutorEditingLocked,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    hasPendingEdit: course.hasPendingEdit,
    enrollmentCount: course._count.enrollments,
  }));
}

export type CourseEditRequestPayload = {
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: string;
  coverImage?: string;
  outcomes?: string[];
  skills?: string[];
  submittedAt: string;
};

export async function submitCourseEditRequest(
  courseId: string,
  tutorId: string,
  data: Omit<CourseEditRequestPayload, "submittedAt">,
) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId: tutorId, archivedAt: null },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.approvalStatus !== CourseApprovalStatus.APPROVED) {
    throw new Error("Edit requests are only for approved courses. Use the draft editor for other statuses.");
  }

  const payload: CourseEditRequestPayload = {
    ...data,
    submittedAt: new Date().toISOString(),
  };

  return prisma.course.update({
    where: { id: courseId },
    data: {
      pendingEdit: payload as unknown as Prisma.InputJsonValue,
      hasPendingEdit: true,
    },
  });
}

export async function getTutorCourseForEdit(tutorId: string, slug: string) {
  return prisma.course.findFirst({
    where: { slug, instructorId: tutorId, archivedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      tagline: true,
      description: true,
      category: true,
      level: true,
      coverImage: true,
      outcomes: true,
      skills: true,
      approvalStatus: true,
      tutorEditingLocked: true,
      hasPendingEdit: true,
      pendingEdit: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getTutorCourseDraft(tutorId: string, courseId?: string | null) {
  // Only fetch a specific course if courseId is provided
  // For new course creation (no courseId), return null to allow fresh start
  if (!courseId) {
    return null;
  }

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      instructorId: tutorId,
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      tagline: true,
      description: true,
      category: true,
      level: true,
      coverImage: true,
      outcomes: true,
      skills: true,
      approvalStatus: true,
      tutorEditingLocked: true,
      draftStructure: true,
    },
  });

  if (!course) {
    return null;
  }

  return course;
}

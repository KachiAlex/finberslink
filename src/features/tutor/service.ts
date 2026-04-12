import { prisma } from "@/lib/prisma";

export async function getTutorCourses(tutorId: string) {
  return prisma.course.findMany({
    where: { instructorId: tutorId },
    include: { enrollments: true },
  });
}

export async function listTutorCourses(tutorId: string) {
  return prisma.course.findMany({
    where: { instructorId: tutorId },
    include: { enrollments: true },
  });
}

export async function getTutorCourseById(courseId: string, tutorId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, instructorId: tutorId },
    include: { enrollments: true, lessons: true },
  });
}

export async function getTutorCourseForEdit(courseId: string, tutorId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, instructorId: tutorId },
    include: { enrollments: true, lessons: true },
  });
}

export async function updateTutorCourse(courseId: string, data: any) {
  return prisma.course.update({
    where: { id: courseId },
    data,
  });
}

export async function submitTutorCourse(courseId: string, data: any) {
  return prisma.course.update({
    where: { id: courseId },
    data,
  });
}


export async function createTutorExam(courseId: string, data: any) {
  return prisma.exam.create({
    data: { courseId, ...data },
  });
}

export async function upsertTutorCourseDraft(courseId: string, data: any) {
  return prisma.courseDraft.upsert({
    where: { courseId },
    update: data,
    create: { courseId, ...data },
  });
}

export async function submitTutorExam(examId: string, data: any) {
  return prisma.exam.update({
    where: { id: examId },
    data,
  });
}

export async function submitCourseEditRequest(courseId: string, data: any) {
  return prisma.courseEditRequest.create({
    data: { courseId, ...data },
  });
}

export async function getTutorCohorts(tutorId: string) {
  return prisma.cohort.findMany({
    where: { instructorId: tutorId },
  });
}

export async function getTutorCourseDraft(courseId: string, tutorId: string) {
  return prisma.courseDraft.findUnique({
    where: { courseId },
  });
}

export async function getTutorForumThreads(tutorId: string) {
  return prisma.forumThread.findMany({
    where: { course: { instructorId: tutorId } },
  });
}

export async function listTutorExams(tutorId: string) {
  return prisma.exam.findMany({
    where: { course: { instructorId: tutorId } },
  });
}

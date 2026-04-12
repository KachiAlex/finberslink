import { prisma } from "@/lib/prisma";

export async function getCourses(userId?: string) {
  if (userId) {
    return prisma.course.findMany({
      where: { enrollments: { some: { userId } } },
    });
  }
  return prisma.course.findMany();
}

export async function getCourseById(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true, enrollments: true },
  });
}

export async function getLearnerLesson(lessonId: string, userId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true },
  });
}

export async function listLearnerCourses(userId: string) {
  return prisma.course.findMany({
    where: { enrollments: { some: { userId } } },
    include: { lessons: true, enrollments: true },
  });
}

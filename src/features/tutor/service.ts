import { prisma } from "@/lib/prisma";

export async function getTutorCohorts(tutorId: string) {
  return prisma.course.findMany({
    where: { instructorId: tutorId },
    include: {
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
        },
      },
      lessons: {
        select: {
          id: true,
          title: true,
          slug: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingForumPosts(tutorId: string) {
  const courses = await prisma.course.findMany({
    where: { instructorId: tutorId },
    select: { id: true },
  });

  const courseIds = courses.map((c) => c.id);

  return prisma.forumPost.findMany({
    where: {
      thread: {
        courseId: { in: courseIds },
      },
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      thread: {
        select: {
          id: true,
          courseId: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getTutorOfficeHours(tutorId: string) {
  // TODO: Implement office hours once OfficeHour model is added to schema
  return [];
}

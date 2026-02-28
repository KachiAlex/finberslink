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
          isPublished: true,
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

  return prisma.forumPost.findMany({
    where: {
      courseId: { in: courses.map((c) => c.id) },
      status: "PENDING",
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
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
  return prisma.officeHour.findMany({
    where: { tutorId },
    include: {
      bookings: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

import { prisma } from "@/lib/prisma";

export async function createForumThread(input: {
  title: string;
  courseId: string;
  authorId: string;
}) {
  return prisma.forumThread.create({
    data: {
      title: input.title,
      courseId: input.courseId,
      authorId: input.authorId,
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
      posts: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function listForumThreads(courseId?: string, limit = 20) {
  const where = courseId ? { courseId } : {};

  return prisma.forumThread.findMany({
    where,
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
      posts: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getForumThreadById(id: string) {
  return prisma.forumThread.findUnique({
    where: { id },
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
      posts: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createForumPost(input: {
  content: string;
  threadId: string;
  authorId: string;
  lessonId?: string;
  parentId?: string;
}) {
  return prisma.forumPost.create({
    data: {
      content: input.content,
      threadId: input.threadId,
      authorId: input.authorId,
      lessonId: input.lessonId,
      parentId: input.parentId,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
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
  });
}

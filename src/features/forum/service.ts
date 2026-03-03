import { prisma } from "@/lib/prisma";

type ThreadFilters = {
  courseId?: string;
  limit?: number;
};

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
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: { posts: true },
      },
    },
  });
}

export async function listForumThreads(filters: ThreadFilters = {}) {
  const { courseId, limit = 20 } = filters;
  return prisma.forumThread.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: { updatedAt: "desc" },
    take: limit,
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
        },
      },
      posts: {
        orderBy: { createdAt: "asc" },
        take: 1,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          posts: true,
        },
      },
    },
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
        orderBy: { createdAt: "asc" },
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
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
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
        },
      },
    },
  });
}

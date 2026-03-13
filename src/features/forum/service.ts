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
      mentions: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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

type CreateForumPostInput = {
  content: string;
  threadId: string;
  authorId: string;
  lessonId?: string;
  parentId?: string;
  mentions?: string[]; // handles (e.g., @handle)
};

async function resolveMentionHandles(handles: string[]) {
  if (!handles.length) return [];
  const uniqueHandles = Array.from(new Set(handles.map((h) => h.toLowerCase())));
  const users = await prisma.user.findMany({
    where: {
      OR: uniqueHandles.map((h) => ({
        email: { startsWith: `${h}@`, mode: "insensitive" },
      })),
    },
    select: { id: true, email: true },
  });

  // Filter to exact username match on email local-part to avoid prefix collisions.
  const matches = users.filter((u) => {
    const local = u.email.split("@")[0].toLowerCase();
    return uniqueHandles.includes(local);
  });

  return matches.map((u) => u.id);
}

export async function createForumPost(input: CreateForumPostInput) {
  const createPost = prisma.forumPost.create({
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

  const mentionUserIds = input.mentions && input.mentions.length > 0 ? await resolveMentionHandles(input.mentions) : [];
  const mentionCreate =
    mentionUserIds.length > 0
      ? prisma.threadMention.createMany({
          data: mentionUserIds.map((userId) => ({
            userId,
            threadId: input.threadId,
          })),
          skipDuplicates: true,
        })
      : null;

  const [post] = await prisma.$transaction([createPost, ...(mentionCreate ? [mentionCreate] : [])]);
  return post as Awaited<typeof createPost>;
}

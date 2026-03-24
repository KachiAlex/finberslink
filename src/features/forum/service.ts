import { prisma } from "@/lib/prisma";

type ThreadFilters = {
  courseId?: string;
  limit?: number;
  cursor?: string;
};

type PostFilters = {
  threadId: string;
  limit?: number;
  cursor?: string;
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
      lastActivityAt: new Date(),
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
      _count: {
        select: { posts: true },
      },
    },
  });
}

export async function listForumThreads(filters: ThreadFilters = {}) {
  const { courseId, limit = 20, cursor } = filters;
  return prisma.forumThread.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: { lastActivityAt: "desc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
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
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}

export async function listThreadPosts(
  threadId: string,
  filters: { limit?: number; cursor?: string } = {}
) {
  const { limit = 50, cursor } = filters;
  return prisma.forumPost.findMany({
    where: {
      threadId,
      parentId: null, // Only top-level posts
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
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
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });
}

export async function listPostReplies(
  postId: string,
  filters: { limit?: number; cursor?: string } = {}
) {
  const { limit = 20, cursor } = filters;
  return prisma.forumPost.findMany({
    where: { parentId: postId },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
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

  const updateThreadActivity = prisma.forumThread.update({
    where: { id: input.threadId },
    data: { lastActivityAt: new Date() },
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

  const [post] = await prisma.$transaction([createPost, updateThreadActivity, ...(mentionCreate ? [mentionCreate] : [])]);
  return post as Awaited<typeof createPost>;
}

export async function getUnreadThreadCount(userId: string, courseId?: string) {
  const threads = await prisma.forumThread.findMany({
    where: courseId ? { courseId } : undefined,
    include: {
      reads: {
        where: { userId },
        select: { lastReadAt: true },
      },
    },
  });

  return threads.filter(
    (thread) =>
      !thread.reads.length ||
      !thread.reads[0]?.lastReadAt ||
      new Date(thread.reads[0].lastReadAt) < new Date(thread.updatedAt)
  ).length;
}

export async function markThreadAsRead(userId: string, threadId: string) {
  return prisma.threadRead.upsert({
    where: { userId_threadId: { userId, threadId } },
    update: { lastReadAt: new Date() },
    create: { userId, threadId, lastReadAt: new Date() },
  });
}

export async function getThreadUnreadPostCount(userId: string, threadId: string) {
  const read = await prisma.threadRead.findUnique({
    where: { userId_threadId: { userId, threadId } },
  });

  if (!read?.lastReadAt) {
    // User hasn't read this thread, count all posts
    return prisma.forumPost.count({
      where: { threadId },
    });
  }

  // Count posts created after user's last read time
  return prisma.forumPost.count({
    where: {
      threadId,
      createdAt: {
        gt: read.lastReadAt,
      },
    },
  });
}

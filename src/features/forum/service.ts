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
  const thread = await prisma.forumThread.create({
    data: {
      title: input.title,
      courseId: input.courseId,
      authorId: input.authorId,
      lastActivityAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      courseId: true,
      authorId: true,
      lastActivityAt: true,
      createdAt: true,
    },
  });

  const [author, course, postCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: thread.authorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.course.findUnique({
      where: { id: thread.courseId },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    }),
    prisma.forumPost.count({
      where: { threadId: thread.id },
    }),
  ]);

  return {
    ...thread,
    author,
    course,
    _count: { posts: postCount },
  };
}

export async function listForumThreads(filters: ThreadFilters = {}) {
  const { courseId, limit = 20, cursor } = filters;
  
  const threads = await prisma.forumThread.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: { lastActivityAt: "desc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    select: {
      id: true,
      title: true,
      courseId: true,
      authorId: true,
      lastActivityAt: true,
      createdAt: true,
    },
  });

  const [authors, courses, postCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: threads.map(t => t.authorId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.course.findMany({
      where: { id: { in: threads.map(t => t.courseId) } },
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.forumPost.groupBy({
      by: ["threadId"],
      where: { threadId: { in: threads.map(t => t.id) } },
      _count: true,
    }),
  ]);

  const authorMap = new Map(authors.map(a => [a.id, a]));
  const courseMap = new Map(courses.map(c => [c.id, c]));
  const postCountMap = new Map(postCounts.map(pc => [pc.threadId, pc._count]));

  return threads.map(thread => ({
    ...thread,
    author: authorMap.get(thread.authorId),
    course: courseMap.get(thread.courseId),
    _count: { posts: postCountMap.get(thread.id) ?? 0 },
  }));
}

export async function getForumThreadById(id: string) {
  const thread = await prisma.forumThread.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      courseId: true,
      authorId: true,
      lastActivityAt: true,
      createdAt: true,
    },
  });

  if (!thread) {
    return null;
  }

  const [author, course, mentions, postCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: thread.authorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.course.findUnique({
      where: { id: thread.courseId },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    }),
    prisma.forumMention.findMany({
      where: { threadId: thread.id },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.forumPost.count({
      where: { threadId: thread.id },
    }),
  ]);

  return {
    ...thread,
    author,
    course,
    mentions,
    _count: { posts: postCount },
  };
}

export async function listThreadPosts(
  threadId: string,
  filters: { limit?: number; cursor?: string } = {}
) {
  const { limit = 50, cursor } = filters;
  const posts = await prisma.forumPost.findMany({
    where: {
      threadId,
      parentId: null,
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    select: {
      id: true,
      content: true,
      threadId: true,
      authorId: true,
      lessonId: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const [authors, lessons, replyCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: posts.map(p => p.authorId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    posts.filter(p => p.lessonId).length > 0
      ? prisma.lesson.findMany({
          where: { id: { in: posts.filter(p => p.lessonId).map(p => p.lessonId!) } },
          select: {
            id: true,
            title: true,
          },
        })
      : Promise.resolve([]),
    prisma.forumPost.groupBy({
      by: ["parentId"],
      where: { parentId: { in: posts.map(p => p.id) } },
      _count: true,
    }),
  ]);

  const authorMap = new Map(authors.map(a => [a.id, a]));
  const lessonMap = new Map((lessons as any[]).map(l => [l.id, l]));
  const replyCountMap = new Map(replyCounts.map(rc => [rc.parentId, rc._count]));

  return posts.map(post => ({
    ...post,
    author: authorMap.get(post.authorId),
    lesson: post.lessonId ? lessonMap.get(post.lessonId) : null,
    _count: { replies: replyCountMap.get(post.id) ?? 0 },
  }));
}

export async function listPostReplies(
  postId: string,
  filters: { limit?: number; cursor?: string } = {}
) {
  const { limit = 20, cursor } = filters;
  const replies = await prisma.forumPost.findMany({
    where: { parentId: postId },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    select: {
      id: true,
      content: true,
      threadId: true,
      authorId: true,
      lessonId: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const authors = await prisma.user.findMany({
    where: { id: { in: replies.map(r => r.authorId) } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  const authorMap = new Map(authors.map(a => [a.id, a]));

  return replies.map(reply => ({
    ...reply,
    author: authorMap.get(reply.authorId),
  }));
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

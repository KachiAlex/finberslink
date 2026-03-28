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
  // Step 1: Create thread with explicit scalar select
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

  // Step 2: Load author separately (handles null gracefully)
  const author = thread.authorId 
    ? await prisma.user.findUnique({
        where: { id: thread.authorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      })
    : null;

  // Step 3: Load course separately (handles null gracefully)
  const course = thread.courseId
    ? await prisma.course.findUnique({
        where: { id: thread.courseId },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      })
    : null;

  // Step 4: Get post count
  const postCount = await prisma.forumPost.count({
    where: { threadId: thread.id },
  });

  return {
    id: thread.id,
    title: thread.title,
    courseId: thread.courseId,
    authorId: thread.authorId,
    lastActivityAt: thread.lastActivityAt,
    createdAt: thread.createdAt,
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

  if (threads.length === 0) {
    return [];
  }

  // Load related data
  const authorIds = [...new Set(threads.map(t => t.authorId))];
  const courseIds = [...new Set(threads.map(t => t.courseId))];
  
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  });

  const authorMap = new Map(authors.map(a => [a.id, a]));
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // Assemble results
  return threads.map(thread => ({
    ...thread,
    author: authorMap.get(thread.authorId) || null,
    course: courseMap.get(thread.courseId) || null,
    _count: { posts: 0 }, // Simplified - counts will be fetched when needed
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

  // Load author and course separately
  const author = thread.authorId 
    ? await prisma.user.findUnique({
        where: { id: thread.authorId },
        select: { id: true, firstName: true, lastName: true },
      })
    : null;

  const course = thread.courseId
    ? await prisma.course.findUnique({
        where: { id: thread.courseId },
        select: { id: true, title: true, slug: true },
      })
    : null;

  // Load mentions separately (no nested include)
  const mentionRows = await prisma.threadMention.findMany({
    where: { threadId: thread.id },
    select: {
      id: true,
      userId: true,
    },
  });

  const mentionUsers =
    mentionRows.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: mentionRows.map((m) => m.userId) } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [];

  const mentionUserMap = new Map(mentionUsers.map((u) => [u.id, u]));
  const mentions = mentionRows.map((mention) => ({
    ...mention,
    user: mentionUserMap.get(mention.userId) ?? null,
  }));

  const postCount = await prisma.forumPost.count({
    where: { threadId: thread.id },
  });

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
    where: { threadId, parentId: null },
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

  if (posts.length === 0) {
    return [];
  }

  // Load authors separately
  const authorIds = [...new Set(posts.map(p => p.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const authorMap = new Map(authors.map(a => [a.id, a]));

  return posts.map(post => ({
    ...post,
    author: authorMap.get(post.authorId),
    lesson: null, // Simplified
    _count: { replies: 0 }, // Will be fetched when needed
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

  if (replies.length === 0) {
    return [];
  }

  // Load authors separately
  const authorIds = [...new Set(replies.map(r => r.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, firstName: true, lastName: true },
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

  const [author, lesson] = await Promise.all([
    prisma.user.findUnique({
      where: { id: post.authorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    post.lessonId
      ? prisma.lesson.findUnique({
          where: { id: post.lessonId },
          select: {
            id: true,
            title: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    ...post,
    author,
    lesson,
  };
}

export async function getUnreadThreadCount(userId: string, courseId?: string) {
  const threads = await prisma.forumThread.findMany({
    where: courseId ? { courseId } : undefined,
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const reads = await prisma.threadRead.findMany({
    where: {
      userId,
      ...(courseId
        ? {
            thread: {
              courseId,
            },
          }
        : {}),
    },
    select: {
      threadId: true,
      lastReadAt: true,
    },
  });

  const readMap = new Map(reads.map((read) => [read.threadId, read.lastReadAt]));

  return threads.filter(
    (thread) => {
      const lastReadAt = readMap.get(thread.id);
      return !lastReadAt || new Date(lastReadAt) < new Date(thread.updatedAt);
    }
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

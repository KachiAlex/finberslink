import { prisma } from "@/lib/prisma";

export async function getForumThreadById(threadId: string) {
  return prisma.forumThread.findUnique({
    where: { id: threadId },
    include: { posts: true },
  });
}

export async function createForumPost(threadId: string, content: string, userId: string) {
  return prisma.forumPost.create({
    data: {
      content,
      threadId,
      userId,
    },
  });
}

export async function listThreadPosts(threadId: string) {
  return prisma.forumPost.findMany({
    where: { threadId },
    include: { author: true },
  });
}

export async function listPostReplies(postId: string) {
  return prisma.forumPost.findMany({
    where: { parentPostId: postId },
    include: { author: true },
  });
}

export async function markThreadAsRead(threadId: string, userId: string) {
  return prisma.forumThreadRead.upsert({
    where: { threadId_userId: { threadId, userId } },
    update: { readAt: new Date() },
    create: { threadId, userId, readAt: new Date() },
  });
}

export async function listForumThreads(options: any) {
  return prisma.forumThread.findMany({
    where: options.courseId ? { courseId: options.courseId } : {},
    take: options.limit || 10,
    skip: options.cursor ? 1 : 0,
  });
}

export async function createForumThread(data: any) {
  return prisma.forumThread.create({
    data,
  });
}

export async function getUnreadThreadCount(userId: string) {
  return prisma.forumThread.count({
    where: {
      reads: {
        none: { userId },
      },
    },
  });
}

export async function createThreadWithTags(data: any) {
  return prisma.forumThread.create({
    data,
  });
}

export async function listThreadsByTag(tag: string, limit: number, cursor?: string) {
  return prisma.forumThread.findMany({
    where: { tags: { has: tag } },
    take: limit,
  });
}

export async function listThreadsByQuery(query: string, limit: number) {
  return prisma.forumThread.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    take: limit,
  });
}


export async function addPostReaction(postId: string, userId: string, reaction: string) {
  return prisma.forumPostReaction.create({
    data: { postId, userId, reaction },
  });
}

export async function subscribeToThread(threadId: string, userId: string) {
  return prisma.forumThreadSubscription.create({
    data: { threadId, userId },
  });
}

export async function unsubscribeFromThread(threadId: string, userId: string) {
  return prisma.forumThreadSubscription.deleteMany({
    where: { threadId, userId },
  });
}

export async function listUserThreadSubscriptions(userId: string) {
  return prisma.forumThreadSubscription.findMany({
    where: { userId },
    include: { thread: true },
  });
}

export async function listPostEdits(postId: string) {
  return prisma.forumPostEdit.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listPostReactions(postId: string) {
  return prisma.forumPostReaction.findMany({
    where: { postId },
  });
}

export async function removePostReaction(postId: string, userId: string, reaction: string) {
  return prisma.forumPostReaction.deleteMany({
    where: { postId, userId, reaction },
  });
}

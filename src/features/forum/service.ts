// Forum Service with Optimized Queries and TypeScript Types
import { prisma } from "../../lib/prisma";
import { ForumThread, ForumPost, ForumPostReaction, ForumThreadSubscription, ThreadCreateData, PostCreateData, ThreadListParams, PostListParams, UserMention } from './types';
import { NotificationService } from '../resume/notification-service';

// Event broadcasting helper
async function broadcastForumEvent(event: {
  type: 'thread_created' | 'thread_updated' | 'post_created' | 'post_updated' | 'post_deleted';
  data: any;
  threadId?: string;
  courseId?: string;
}) {
  try {
    // In production, this would be a proper event system (Redis, etc.)
    // For now, we'll use a simple in-memory approach
    if (process.env.NODE_ENV === 'development') {
      // Import the broadcast function dynamically to avoid circular dependencies
      const { broadcastForumEvent: broadcast } = await import('../../../app/api/forum/realtime/route');
      broadcast(event);
    }
  } catch (error) {
    console.error('Failed to broadcast forum event:', error);
  }
}

// --- THREAD OPERATIONS ---

export async function createThreadWithTags(data: ThreadCreateData & { authorId: string }): Promise<ForumThread> {
  const thread = await prisma.forumThread.create({
    data: {
      title: data.title,
      courseId: data.courseId,
      authorId: data.authorId,
      tags: data.tags || [],
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
          subscriptions: true,
        },
      },
    },
  });

  // Broadcast real-time event
  await broadcastForumEvent({
    type: 'thread_created',
    data: thread,
    courseId: data.courseId,
  });

  return thread;
}

export async function listThreadsByTag(tag: string, limit = 20, cursor?: string): Promise<{ threads: ForumThread[]; hasMore: boolean; nextCursor?: string }> {
  const threads = await prisma.forumThread.findMany({
    where: { tags: { has: tag } },
    orderBy: { lastActivityAt: "desc" },
    take: limit + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
          subscriptions: true,
        },
      },
    },
  });

  const hasMore = threads.length > limit;
  const nextCursor = hasMore ? threads[limit - 1]?.id : undefined;
  
  return {
    threads: hasMore ? threads.slice(0, -1) : threads,
    hasMore,
    nextCursor,
  };
}

export async function listThreadsByQuery(q: string, limit = 20, cursor?: string): Promise<{ threads: ForumThread[]; hasMore: boolean; nextCursor?: string }> {
  const threads = await prisma.forumThread.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { posts: { some: { content: { contains: q, mode: 'insensitive' } } } },
      ],
    },
    orderBy: { lastActivityAt: 'desc' },
    take: limit + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
          subscriptions: true,
        },
      },
    },
  });

  const hasMore = threads.length > limit;
  const nextCursor = hasMore ? threads[limit - 1]?.id : undefined;
  
  return {
    threads: hasMore ? threads.slice(0, -1) : threads,
    hasMore,
    nextCursor,
  };
}

// THREAD SUBSCRIPTIONS
export async function subscribeToThread(userId: string, threadId: string): Promise<ForumThreadSubscription> {
  return prisma.forumThreadSubscription.upsert({
    where: { threadId_userId: { threadId, userId } },
    update: {},
    create: { threadId, userId },
    include: {
      thread: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function unsubscribeFromThread(userId: string, threadId: string): Promise<void> {
  await prisma.forumThreadSubscription.deleteMany({
    where: { threadId, userId },
  });
}

export async function listUserThreadSubscriptions(userId: string): Promise<ForumThreadSubscription[]> {
  return prisma.forumThreadSubscription.findMany({
    where: { userId },
    include: {
      thread: {
        select: {
          id: true,
          title: true,
          lastActivityAt: true,
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
    orderBy: { createdAt: 'desc' },
  });
}

// --- POST REACTIONS ---

export async function addPostReaction({ postId, userId, type }: { postId: string; userId: string; type: string }): Promise<ForumPostReaction> {
  return prisma.forumPostReaction.upsert({
    where: { postId_userId_type: { postId, userId, type } },
    update: {},
    create: { postId, userId, type },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function removePostReaction({ postId, userId, type }: { postId: string; userId: string; type: string }): Promise<void> {
  await prisma.forumPostReaction.deleteMany({
    where: { postId, userId, type },
  });
}

export async function listPostReactions(postId: string): Promise<ForumPostReaction[]> {
  return prisma.forumPostReaction.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// --- CORE THREAD OPERATIONS ---

export async function createForumThread(input: ThreadCreateData & { authorId: string }): Promise<ForumThread> {
  const thread = await prisma.forumThread.create({
    data: {
      title: input.title,
      courseId: input.courseId,
      authorId: input.authorId,
      lastActivityAt: new Date(),
      tags: input.tags || [],
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
          subscriptions: true,
        },
      },
    },
  });

  // Broadcast real-time event
  await broadcastForumEvent({
    type: 'thread_created',
    data: thread,
    courseId: input.courseId,
  });

  return thread;
}

export async function listForumThreads(params: ThreadListParams = {}): Promise<{ threads: ForumThread[]; hasMore: boolean; nextCursor?: string; unreadCount?: number }> {
  const { courseId, limit = 20, cursor, includeUnread, userId } = params;
  
  const threads = await prisma.forumThread.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: { lastActivityAt: "desc" },
    take: limit + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
          subscriptions: true,
        },
      },
    },
  });

  const hasMore = threads.length > limit;
  const nextCursor = hasMore ? threads[limit - 1]?.id : undefined;
  const resultThreads = hasMore ? threads.slice(0, -1) : threads;

  let unreadCount: number | undefined;
  if (includeUnread && userId) {
    unreadCount = await getUnreadThreadCount(userId, courseId);
  }

  return {
    threads: resultThreads,
    hasMore,
    nextCursor,
    unreadCount,
  };
}


export async function getForumThreadById(id: string): Promise<ForumThread | null> {
  return prisma.forumThread.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
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
          subscriptions: true,
        },
      },
    },
  });
}

export async function listThreadPosts(
  threadId: string,
  params: PostListParams & { isAdmin?: boolean } = {}
): Promise<{ posts: ForumPost[]; hasMore: boolean; nextCursor?: string }> {
  const { limit = 50, cursor, isAdmin = false } = params;
  const posts = await prisma.forumPost.findMany({
    where: {
      threadId,
      parentId: null,
      ...(isAdmin ? {} : { deletedAt: null }),
    },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
        },
      },
      reactions: {
        include: {
          user: {
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
          replies: true,
          reactions: true,
        },
      },
    },
  });

  const hasMore = posts.length > limit;
  const nextCursor = hasMore ? posts[limit - 1]?.id : undefined;
  
  return {
    posts: hasMore ? posts.slice(0, -1) : posts,
    hasMore,
    nextCursor,
  };
}

export async function listPostReplies(
  postId: string,
  params: { limit?: number; cursor?: string; isAdmin?: boolean } = {}
): Promise<{ posts: ForumPost[]; hasMore: boolean; nextCursor?: string }> {
  const { limit = 20, cursor, isAdmin = false } = params;
  const replies = await prisma.forumPost.findMany({
    where: {
      parentId: postId,
      ...(isAdmin ? {} : { deletedAt: null }),
    },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const hasMore = replies.length > limit;
  const nextCursor = hasMore ? replies[limit - 1]?.id : undefined;
  
  return {
    posts: hasMore ? replies.slice(0, -1) : replies,
    hasMore,
    nextCursor,
  };
}

// --- POST OPERATIONS ---

export async function createForumPost(input: PostCreateData): Promise<ForumPost> {
  // Create post with included data
  const post = await prisma.forumPost.create({
    data: {
      content: input.content,
      threadId: input.threadId,
      authorId: input.authorId,
      parentId: input.parentId,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      thread: {
        select: {
          id: true,
          title: true,
          courseId: true,
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

  // Update thread activity
  await prisma.forumThread.update({
    where: { id: input.threadId },
    data: { lastActivityAt: new Date() },
  });

  // Handle mentions if provided
  if (input.mentions && input.mentions.length > 0) {
    await handleMentions(input.threadId, post.id, input.authorId, input.mentions, input.content);
  }

  // Broadcast real-time event
  await broadcastForumEvent({
    type: 'post_created',
    data: post,
    threadId: input.threadId,
    courseId: post.thread?.courseId,
  });

  return post;
}

async function handleMentions(threadId: string, postId: string, authorId: string, mentions: string[], content: string): Promise<void> {
  // Resolve mention handles to user IDs
  const mentionUserIds = await resolveMentionHandles(mentions);
  
  if (mentionUserIds.length === 0) return;

  // Create thread mentions
  await prisma.threadMention.createMany({
    data: mentionUserIds.map(userId => ({
      userId,
      threadId,
    })),
    skipDuplicates: true,
  });

  // Create notifications for mentioned users (excluding the author)
  const notificationTargets = mentionUserIds.filter(uid => uid !== authorId);
  
  if (notificationTargets.length > 0) {
    await NotificationService.createBulkNotifications(
      notificationTargets.map(userId => ({
        userId,
        type: 'MENTION',
        payload: {
          threadId,
          postId,
          snippet: content.slice(0, 200),
        },
      }))
    );
  }
}

async function resolveMentionHandles(handles: string[]): Promise<string[]> {
  if (!handles.length) return [];
  
  const uniqueHandles = Array.from(new Set(handles.map(h => h.toLowerCase())));
  const users = await prisma.user.findMany({
    where: {
      OR: uniqueHandles.map(handle => ({
        email: { startsWith: `${handle}@`, mode: 'insensitive' },
      })),
    },
    select: { id: true, email: true },
  });

  // Filter to exact username match on email local-part
  const matches = users.filter(user => {
    const local = user.email.split('@')[0].toLowerCase();
    return uniqueHandles.includes(local);
  });

  return matches.map(user => user.id);
}

// --- POST EDITING ---

export async function recordPostEdit(postId: string, editorId: string, previousContent: string, newContent?: string): Promise<void> {
  await prisma.forumPostEdit.create({
    data: {
      postId,
      editorId,
      previousContent,
      newContent: newContent ?? null,
    },
  });

  // Update the post's edited timestamp
  await prisma.forumPost.update({
    where: { id: postId },
    data: { editedAt: new Date() },
  });
}

export async function listPostEdits(postId: string): Promise<any[]> {
  return prisma.forumPostEdit.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    include: {
      editor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function updateForumPost(postId: string, content: string, editorId: string): Promise<ForumPost> {
  // Get current post for edit history
  const currentPost = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { content: true, threadId: true },
  });

  if (!currentPost) {
    throw new Error('Post not found');
  }

  // Record edit history
  await recordPostEdit(postId, editorId, currentPost.content, content);

  // Update post
  const updatedPost = await prisma.forumPost.update({
    where: { id: postId },
    data: { content },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      thread: {
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
    },
  });

  // Broadcast real-time event
  await broadcastForumEvent({
    type: 'post_updated',
    data: updatedPost,
    threadId: currentPost.threadId,
    courseId: updatedPost.thread?.courseId,
  });

  return updatedPost;
}

export async function deleteForumPost(postId: string): Promise<void> {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { threadId: true },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  await prisma.forumPost.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  // Broadcast real-time event
  await broadcastForumEvent({
    type: 'post_deleted',
    data: { id: postId, deletedAt: new Date() },
    threadId: post.threadId,
  });
}

// --- THREAD READ TRACKING ---

export async function getUnreadThreadCount(userId: string, courseId?: string): Promise<number> {
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
      ...(courseId ? {
        thread: { courseId },
      } : {}),
    },
    select: {
      threadId: true,
      lastReadAt: true,
    },
  });

  const readMap = new Map(reads.map(read => [read.threadId, read.lastReadAt]));

  return threads.filter(thread => {
    const lastReadAt = readMap.get(thread.id);
    return !lastReadAt || new Date(lastReadAt) < new Date(thread.updatedAt);
  }).length;
}

export async function markThreadAsRead(userId: string, threadId: string): Promise<void> {
  await prisma.threadRead.upsert({
    where: { userId_threadId: { userId, threadId } },
    update: { lastReadAt: new Date() },
    create: { userId, threadId, lastReadAt: new Date() },
  });
}

export async function getThreadUnreadPostCount(userId: string, threadId: string): Promise<number> {
  const read = await prisma.threadRead.findUnique({
    where: { userId_threadId: { userId, threadId } },
  });

  if (!read?.lastReadAt) {
    // User hasn't read this thread, count all posts
    return prisma.forumPost.count({
      where: { threadId, deletedAt: null },
    });
  }

  // Count posts created after user's last read time
  return prisma.forumPost.count({
    where: {
      threadId,
      createdAt: { gt: read.lastReadAt },
      deletedAt: null,
    },
  });
}

// --- USER SEARCH FOR MENTIONS ---

export async function searchUsersForMentions(query: string, limit = 10): Promise<UserMention[]> {
  if (!query || query.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    take: limit,
  });

  return users.map(user => ({
    id: user.id,
    handle: user.email.split('@')[0],
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  }));
}



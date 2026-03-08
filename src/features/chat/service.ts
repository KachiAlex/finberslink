import { prisma } from "@/lib/prisma";
import {
  ChatNotificationType,
  ChatRole,
  ChatThreadType,
  Prisma,
  TenantPlanTier,
  TenantStatus,
  type Prisma as PrismaNamespace,
} from "@prisma/client";

const DEFAULT_THREAD_LIMIT = 20;
const DEFAULT_MESSAGE_LIMIT = 50;

const THREAD_CARD_INCLUDE = {
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  lesson: {
    select: {
      id: true,
      title: true,
    },
  },
  messages: {
    orderBy: { sentAt: "desc" },
    take: 1,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  },
  _count: {
    select: { messages: true },
  },
} satisfies Prisma.ChatThreadInclude;

type Pagination = {
  limit?: number;
  cursor?: string | null;
};

export async function ensureMembership({ userId, chatSpaceId }: { userId: string; chatSpaceId: string }) {
  const membership = await prisma.chatMembership.findFirst({
    where: { userId, chatSpaceId },
  });
  if (!membership) {
    const error = new Error("CHAT_ACCESS_DENIED");
    (error as any).status = 403;
    throw error;
  }
  return membership;
}

export async function listChatSpacesForUser(input: { tenantId: string; userId: string }) {
  const { tenantId, userId } = input;
  return prisma.chatSpace.findMany({
    where: {
      tenantId,
      OR: [{ visibility: "TENANT_WIDE" }, { memberships: { some: { userId } } }],
    },
    include: {
      memberships: {
        where: { userId },
        select: { role: true, mutedUntil: true },
      },
      _count: { select: { threads: true, memberships: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { title: "asc" },
  });
}

type JsonValue = PrismaNamespace.JsonValue;

export async function ensureChatSpace(input: {
  tenantId: string;
  slug: string;
  title: string;
  courseId?: string | null;
  visibility?: "COURSE_ONLY" | "TENANT_WIDE";
  settings?: PrismaNamespace.InputJsonValue;
}) {
  const { tenantId, slug, title, courseId, visibility = "COURSE_ONLY", settings = {} as PrismaNamespace.InputJsonValue } = input;
  return prisma.chatSpace.upsert({
    where: { slug },
    update: { title, courseId: courseId ?? undefined, visibility, settings },
    create: { tenantId, slug, title, courseId: courseId ?? undefined, visibility, settings },
    include: { course: { select: { id: true, title: true, slug: true } } },
  });
}

export async function upsertChatMembership(input: {
  chatSpaceId: string;
  userId: string;
  role?: ChatRole;
}) {
  const { chatSpaceId, userId, role = ChatRole.STUDENT } = input;
  return prisma.chatMembership.upsert({
    where: { chatSpaceId_userId: { chatSpaceId, userId } },
    create: { chatSpaceId, userId, role },
    update: { role },
  });
}

export async function listChatThreads(input: {
  chatSpaceId: string;
  userId: string;
  type?: ChatThreadType;
} & Pagination) {
  const { chatSpaceId, userId, type, limit = DEFAULT_THREAD_LIMIT, cursor } = input;
  await ensureMembership({ userId, chatSpaceId });
  return prisma.chatThread.findMany({
    where: { chatSpaceId, type },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { lastMessageAt: "desc" },
    include: THREAD_CARD_INCLUDE,
  });
}

export async function createChatThread(input: {
  chatSpaceId: string;
  createdById: string;
  title?: string;
  type?: ChatThreadType;
  lessonId?: string;
}) {
  const { chatSpaceId, createdById, title, type = ChatThreadType.CHANNEL, lessonId } = input;
  const membership = await ensureMembership({ userId: createdById, chatSpaceId });
  if (membership.role === ChatRole.GUEST) {
    const error = new Error("CHAT_GUEST_CANNOT_CREATE_THREAD");
    (error as any).status = 403;
    throw error;
  }
  const thread = await prisma.chatThread.create({
    data: {
      chatSpaceId,
      createdById,
      type,
      title,
      lessonId,
      lastMessageAt: new Date(),
    },
    include: THREAD_CARD_INCLUDE,
  });
  await prisma.chatReadReceipt.upsert({
    where: { threadId_userId: { threadId: thread.id, userId: createdById } },
    create: { threadId: thread.id, userId: createdById },
    update: { lastReadAt: new Date() },
  });
  return thread;
}

export async function listThreadMessages(input: {
  threadId: string;
  userId: string;
} & Pagination) {
  const { threadId, userId, limit = DEFAULT_MESSAGE_LIMIT, cursor } = input;
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: { chatSpaceId: true },
  });
  if (!thread) {
    const error = new Error("CHAT_THREAD_NOT_FOUND");
    (error as any).status = 404;
    throw error;
  }
  await ensureMembership({ userId, chatSpaceId: thread.chatSpaceId });
  return prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { sentAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      replies: {
        select: { id: true, authorId: true },
      },
    },
  });
}

type SendMessageInput = {
  threadId: string;
  authorId: string;
  content: string;
  attachments?: PrismaNamespace.InputJsonValue;
  parentId?: string;
  mentionUserIds?: string[];
};

export async function sendChatMessage(input: SendMessageInput) {
  const { threadId, authorId } = input;
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: { chatSpaceId: true },
  });
  if (!thread) {
    const error = new Error("CHAT_THREAD_NOT_FOUND");
    (error as any).status = 404;
    throw error;
  }
  await ensureMembership({ userId: authorId, chatSpaceId: thread.chatSpaceId });

  const parent = input.parentId
    ? await prisma.chatMessage.findUnique({
        where: { id: input.parentId },
        select: { id: true, authorId: true },
      })
    : null;

  const mentionIds = Array.from(new Set((input.mentionUserIds ?? []).filter((id) => id !== authorId)));

  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        threadId,
        authorId,
        content: input.content,
        parentId: input.parentId,
        attachments: (input.attachments ?? []) as any,
        mentions: mentionIds,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  const notifications: Prisma.ChatNotificationCreateManyInput[] = [];
  for (const userId of mentionIds) {
    notifications.push({
      userId,
      threadId,
      messageId: message.id,
      type: ChatNotificationType.MENTION,
      sentAt: new Date(),
    });
  }
  if (parent?.authorId && parent.authorId !== authorId) {
    notifications.push({
      userId: parent.authorId,
      threadId,
      messageId: message.id,
      type: ChatNotificationType.REPLY,
      sentAt: new Date(),
    });
  }
  if (notifications.length) {
    await prisma.chatNotification.createMany({ data: notifications, skipDuplicates: true });
  }

  return message;
}

export async function markThreadRead(input: { threadId: string; userId: string; readAt?: Date }) {
  const { threadId, userId, readAt = new Date() } = input;
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: { chatSpaceId: true },
  });
  if (!thread) {
    const error = new Error("CHAT_THREAD_NOT_FOUND");
    (error as any).status = 404;
    throw error;
  }
  await ensureMembership({ userId, chatSpaceId: thread.chatSpaceId });
  return prisma.chatReadReceipt.upsert({
    where: { threadId_userId: { threadId, userId } },
    create: { threadId, userId, lastReadAt: readAt },
    update: { lastReadAt: readAt },
  });
}

export async function listChatNotifications(input: {
  userId: string;
  limit?: number;
  includeSeen?: boolean;
}) {
  const { userId, limit = DEFAULT_THREAD_LIMIT, includeSeen = false } = input;
  return prisma.chatNotification.findMany({
    where: { userId, seenAt: includeSeen ? undefined : null },
    orderBy: { sentAt: "desc" },
    take: limit,
    include: {
      message: {
        select: {
          id: true,
          content: true,
          sentAt: true,
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      thread: {
        select: { id: true, title: true, chatSpaceId: true },
      },
    },
  });
}

export async function markChatNotificationsSeen(userId: string, notificationIds: string[]) {
  if (!notificationIds.length) return { count: 0 };
  const result = await prisma.chatNotification.updateMany({
    where: { userId, id: { in: notificationIds }, seenAt: null },
    data: { seenAt: new Date() },
  });
  return { count: result.count };
}

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultTenant } from "@/features/tenant/service";
import { ChatNotificationType, ChatRole, ChatThreadType, Prisma, type Prisma as PrismaNamespace } from "@prisma/client";

const DEFAULT_THREAD_LIMIT = 20;
const DEFAULT_MESSAGE_LIMIT = 50;

type StatusError = Error & { status?: number };

function createStatusError(message: string, status: number): StatusError {
  const error: StatusError = new Error(message);
  error.status = status;
  return error;
}

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
    throw createStatusError("NOT_MEMBER", 403);
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
    throw createStatusError("CHAT_GUEST_CANNOT_CREATE_THREAD", 403);
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
    throw createStatusError("NOT_FOUND", 404);
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
    throw createStatusError("NOT_FOUND", 404);
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
        attachments: input.attachments ?? [],
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
    throw createStatusError("NOT_FOUND", 404);
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

async function ensureDefaultCourseThread(input: {
  chatSpaceId: string;
  createdById: string;
  type: ChatThreadType;
  title: string;
  lessonId?: string;
}) {
  const { chatSpaceId, createdById, type, title, lessonId } = input;

  const existing = await prisma.chatThread.findFirst({
    where: {
      chatSpaceId,
      type,
      lessonId: lessonId ?? null,
      ...(lessonId ? {} : { title }),
    },
    include: THREAD_CARD_INCLUDE,
  });

  if (existing) {
    return existing;
  }

  return createChatThread({
    chatSpaceId,
    createdById,
    type,
    title,
    lessonId,
  });
}

export async function ensureCourseChatContext(input: {
  courseIdOrSlug: string;
  userId: string;
  lessonIdOrSlug?: string | null;
}) {
  const { courseIdOrSlug, userId, lessonIdOrSlug } = input;

  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      archivedAt: null,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      instructor: {
        select: {
          id: true,
          role: true,
          tenantId: true,
          firstName: true,
          lastName: true,
        },
      },
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: course.id,
    },
    select: { id: true },
  });

  if (!enrollment) {
    return null;
  }

  const lesson = lessonIdOrSlug
    ? course.lessons.find((item) => item.id === lessonIdOrSlug || item.slug === lessonIdOrSlug) ?? null
    : null;

  const defaultTenant = await getOrCreateDefaultTenant();
  const tenantId = course.instructor?.tenantId ?? defaultTenant.id;

  const chatSpace = await ensureChatSpace({
    tenantId,
    courseId: course.id,
    slug: `course-${course.id}-chat`,
    title: `${course.title} Live Chat`,
    settings: {
      scope: "course-live-chat",
      courseId: course.id,
    },
  });

  await upsertChatMembership({
    chatSpaceId: chatSpace.id,
    userId,
    role: ChatRole.STUDENT,
  });

  const defaultThreadOwnerId = course.instructor?.id ?? userId;

  if (course.instructor?.id) {
    await upsertChatMembership({
      chatSpaceId: chatSpace.id,
      userId: course.instructor.id,
      role: course.instructor.role === "TUTOR" ? ChatRole.TUTOR : ChatRole.ADMIN,
    });
  }

  const generalThread = await ensureDefaultCourseThread({
    chatSpaceId: chatSpace.id,
    createdById: defaultThreadOwnerId,
    type: ChatThreadType.CHANNEL,
    title: "General",
  });

  const lessonThread = lesson
    ? await ensureDefaultCourseThread({
        chatSpaceId: chatSpace.id,
        createdById: defaultThreadOwnerId,
        type: ChatThreadType.LESSON,
        title: `${lesson.title} Live Chat`,
        lessonId: lesson.id,
      })
    : null;

  const threads = await listChatThreads({
    chatSpaceId: chatSpace.id,
    userId,
    limit: 50,
  });

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
    },
    lesson: lesson
      ? {
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
        }
      : null,
    chatSpace: {
      id: chatSpace.id,
      title: chatSpace.title,
      slug: chatSpace.slug,
    },
    selectedThreadId: lessonThread?.id ?? generalThread.id,
    threads,
  };
}

// ============================================================================
// DIRECT MESSAGE FUNCTIONS (1:1 and Group DMs)
// ============================================================================

export async function getOrCreateDirectConversation(input: {
  userId: string;
  targetUserId: string;
}) {
  const { userId, targetUserId } = input;
  if (userId === targetUserId) {
    throw createStatusError("CANNOT_DM_YOURSELF", 400);
  }

  // Try to find existing 1:1 conversation
  const existing = await prisma.directConversation.findFirst({
    where: {
      type: "DIRECT",
      participants: {
        every: { userId: { in: [userId, targetUserId] } },
      },
    },
    include: {
      participants: { select: { userId: true } },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  // Create new 1:1 conversation
  return prisma.directConversation.create({
    data: {
      type: "DIRECT",
      createdById: userId,
      participants: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
    include: {
      participants: { select: { userId: true } },
      messages: { take: 0 },
    },
  });
}

export async function createGroupConversation(input: {
  userId: string;
  name: string;
  participantUserIds: string[];
}) {
  const { userId, name, participantUserIds } = input;

  if (!participantUserIds.includes(userId)) {
    throw createStatusError("CREATOR_MUST_BE_PARTICIPANT", 400);
  }

  if (new Set(participantUserIds).size !== participantUserIds.length) {
    throw createStatusError("DUPLICATE_PARTICIPANTS", 400);
  }

  return prisma.directConversation.create({
    data: {
      type: "GROUP",
      name,
      createdById: userId,
      participants: {
        create: participantUserIds.map((id) => ({
          userId: id,
          role: id === userId ? "ADMIN" : "MEMBER",
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      messages: { take: 0 },
    },
  });
}

export async function listUserConversations(input: { userId: string } & Pagination) {
  const { userId, limit = DEFAULT_THREAD_LIMIT, cursor } = input;

  return prisma.directConversation.findMany({
    where: {
      participants: { some: { userId } },
      archivedAt: null,
    },
    orderBy: { lastMessageAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      participants: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversation(input: { conversationId: string; userId: string }) {
  const { conversationId, userId } = input;

  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!conversation) {
    throw createStatusError("NOT_FOUND", 404);
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw createStatusError("NOT_PARTICIPANT", 403);
  }

  return conversation;
}

export async function listConversationMessages(input: {
  conversationId: string;
  userId: string;
} & Pagination) {
  const { conversationId, userId, limit = DEFAULT_MESSAGE_LIMIT, cursor } = input;

  // Verify user is a participant
  const conversation = await getConversation({ conversationId, userId });

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { sentAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reads: {
        select: {
          userId: true,
          readAt: true,
        },
      },
    },
  });

  return messages;
}

export async function sendDirectMessage(input: {
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: PrismaNamespace.InputJsonValue;
  mentions?: string[];
}) {
  const { conversationId, senderId, content, attachments = [], mentions = [] } = input;

  // Verify user is a participant
  await getConversation({ conversationId, userId: senderId });

  const message = await prisma.$transaction([
    prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        content,
        attachments: attachments as PrismaNamespace.InputJsonValue,
        mentions: mentions as PrismaNamespace.InputJsonValue,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        reads: { select: { userId: true, readAt: true } },
      },
    }),
    prisma.directConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ])[0];

  return message;
}

export async function markDirectMessageRead(input: {
  messageId: string;
  userId: string;
}) {
  const { messageId, userId } = input;

  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
    select: { conversationId: true },
  });

  if (!message) {
    throw createStatusError("NOT_FOUND", 404);
  }

  // Verify user is a participant
  await getConversation({ conversationId: message.conversationId, userId });

  return prisma.directMessageRead.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId },
    update: { readAt: new Date() },
  });
}

export async function markConversationMessagesRead(input: {
  conversationId: string;
  userId: string;
}) {
  const { conversationId, userId } = input;

  // Verify user is a participant
  await getConversation({ conversationId, userId });

  // Find all unread messages from this user's perspective
  const unreadMessages = await prisma.directMessage.findMany({
    where: {
      conversationId,
      reads: {
        none: { userId },
      },
    },
    select: { id: true },
  });

  if (unreadMessages.length === 0) return { count: 0 };

  const result = await prisma.directMessageRead.createMany({
    data: unreadMessages.map((msg) => ({
      messageId: msg.id,
      userId,
    })),
    skipDuplicates: true,
  });

  return result;
}

export async function getUnreadConversationCount(userId: string) {
  const conversations = await prisma.directConversation.findMany({
    where: {
      participants: { some: { userId } },
      archivedAt: null,
    },
    select: {
      id: true,
      messages: {
        where: {
          reads: {
            none: { userId },
          },
        },
        select: { id: true },
      },
    },
  });

  const unreadCount = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  return { count: unreadCount, byConversation: conversations };
}

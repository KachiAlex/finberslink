import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      payload: {
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl,
      },
    },
  });
}

export async function createNotificationIfMissing(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
  dedupeWindowHours?: number;
}) {
  const dedupeWindowHours = input.dedupeWindowHours ?? 24;
  const threshold = new Date(Date.now() - dedupeWindowHours * 60 * 60 * 1000);

  const recent = await prisma.notification.findMany({
    where: {
      userId: input.userId,
      type: input.type,
      createdAt: { gte: threshold },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const duplicate = recent.find((item) => {
    const payload = (item.payload ?? {}) as {
      title?: string;
      actionUrl?: string;
    };

    return payload.title === input.title && (payload.actionUrl ?? "") === (input.actionUrl ?? "");
  });

  if (duplicate) {
    return duplicate;
  }

  return createNotification(input);
}

export async function listUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

export async function markNotificationAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  return null;
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

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

export async function listUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
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

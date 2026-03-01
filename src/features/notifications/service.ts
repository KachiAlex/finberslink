import * as FirestoreService from "@/lib/firestore-service";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
}) {
  return FirestoreService.createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    actionUrl: input.actionUrl,
  });
}

export async function listUserNotifications(userId: string, limit = 20) {
  return FirestoreService.listUserNotifications(userId, limit);
}

export async function markNotificationAsRead(id: string) {
  await FirestoreService.markNotificationAsRead(id);
  return null;
}

export async function markAllNotificationsAsRead(userId: string) {
  return FirestoreService.markAllNotificationsAsRead(userId);
}

export async function getUnreadCount(userId: string) {
  return FirestoreService.getUnreadCount(userId);
}

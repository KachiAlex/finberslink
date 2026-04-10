import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { notificationService } from "@/features/resume/notification-service";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/notifications/{notificationId}/read
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the notification belongs to the user
    const notification = await prisma.resumeNotification.findUnique({
      where: { id: params.notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await notificationService.markAsRead(params.notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      `[PATCH /api/notifications/${params.notificationId}/read] Error:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

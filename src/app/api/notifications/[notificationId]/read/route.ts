import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { NotificationService } from '@/features/resume/notification-service';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/notifications/{notificationId}/read
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = requireAuth(request);

    // Verify notification belongs to user
    const notification = await prisma.resumeNotification.findUnique({
      where: { id: params.notificationId },
      select: { userId: true },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mark as read
    await NotificationService.markAsRead(params.notificationId);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

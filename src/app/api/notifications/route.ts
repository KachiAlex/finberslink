import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/guards';
import { NotificationService } from '@/features/resume/notification-service';

const NotificationsSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const validated = NotificationsSchema.parse({ limit, offset });

    // Get notifications
    const { notifications, unreadCount } = await NotificationService.getNotifications(
      session.userId,
      validated.limit,
      validated.offset
    );

    return NextResponse.json(
      {
        notifications,
        unreadCount,
        limit: validated.limit,
        offset: validated.offset,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', issues: error.issues },
        { status: 400 }
      );
    }
    console.error('Error retrieving notifications:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}

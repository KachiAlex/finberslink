import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/guards';
import { NotificationService } from '@/features/resume/notification-service';

const PreferencesSchema = z.object({
  viewNotifications: z.boolean().optional(),
  downloadNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  aggregateViews: z.boolean().optional(),
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);

    // Get preferences
    const preferences = await NotificationService.getNotificationPreferences(session.userId);

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error('Error retrieving notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();
    const validated = PreferencesSchema.parse(body);

    // Update preferences
    const preferences = await NotificationService.updateNotificationPreferences(
      session.userId,
      validated
    );

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', issues: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

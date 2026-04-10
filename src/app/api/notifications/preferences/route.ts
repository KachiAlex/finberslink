import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../lib/auth/session";
import { notificationService } from "../../../features/resume/notification-service";

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await notificationService.getNotificationPreferences(
      session.user.id
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("[GET /api/notifications/preferences] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
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
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const preferences = await notificationService.updateNotificationPreferences(
      session.user.id,
      body
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("[PATCH /api/notifications/preferences] Error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

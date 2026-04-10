import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { notificationService } from "@/features/resume/notification-service";

/**
 * GET /api/notifications
 * Get all notifications for the current user with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const { notifications, total } = await notificationService.getNotifications(
      session.user.id,
      limit,
      offset
    );

    const unreadCount = await notificationService.getUnreadCount(
      session.user.id
    );

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/features/notifications/service";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    const unreadCount = await getUnreadCount(user.sub);

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Unread count fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}

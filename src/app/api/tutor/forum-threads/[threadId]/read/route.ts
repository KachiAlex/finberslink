import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { threadId: string } }) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden - Tutor access required" }, { status: 403 });
    }

    const threadId = params.threadId;
    if (!threadId) {
      return NextResponse.json({ error: "threadId required" }, { status: 400 });
    }

    await prisma.threadRead.upsert({
      where: { userId_threadId: { userId: user.sub, threadId } },
      update: { lastReadAt: new Date() },
      create: { userId: user.sub, threadId, lastReadAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tutor thread read error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}

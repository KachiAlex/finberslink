// REST API for chat messages (Messenger-style scaffold)
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from "../_helpers";
import { listThreadMessages, sendChatMessage } from "@/features/chat/service";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const cursor = searchParams.get("cursor") || undefined;
    if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
    const messages = await listThreadMessages({
      threadId,
      userId: user.sub,
      limit,
      cursor,
    });
    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const { threadId, content, attachments, parentId, mentionUserIds } = body;
    if (!threadId || !content) return NextResponse.json({ error: "Missing threadId or content" }, { status: 400 });
    const message = await sendChatMessage({
      threadId,
      authorId: user.sub,
      content,
      attachments,
      parentId,
      mentionUserIds,
    });
    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

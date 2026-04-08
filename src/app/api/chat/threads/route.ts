// REST API for chat threads (Messenger-style scaffold)
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from "../_helpers";
import { listChatThreads, createChatThread } from "@/features/chat/service";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const chatSpaceId = searchParams.get("chatSpaceId");
    const type = (searchParams.get("type") ?? undefined) as any as import('@prisma/client').ChatThreadType | undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const cursor = searchParams.get("cursor") || undefined;
    if (!chatSpaceId) return NextResponse.json({ error: "Missing chatSpaceId" }, { status: 400 });
    const threads = await listChatThreads({
      chatSpaceId,
      userId: user.sub,
      type,
      limit,
      cursor,
    });
    return NextResponse.json({ threads });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const { chatSpaceId, title, type, lessonId } = body;
    if (!chatSpaceId) return NextResponse.json({ error: "Missing chatSpaceId" }, { status: 400 });
    const thread = await createChatThread({
      chatSpaceId,
      createdById: user.sub,
      title,
      type,
      lessonId,
    });
    return NextResponse.json({ thread });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

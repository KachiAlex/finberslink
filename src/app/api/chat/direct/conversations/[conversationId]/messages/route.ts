import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../_helpers";
import {
  listConversationMessages,
  sendDirectMessage,
} from "@/features/chat/service";

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = requireAuth(req);
    const { conversationId } = params;
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const cursor = searchParams.get("cursor") || undefined;

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const messages = await listConversationMessages({
      conversationId,
      userId: user.sub,
      limit,
      cursor,
    });

    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = requireAuth(req);
    const { conversationId } = params;
    const body = await req.json();
    const { content, attachments, mentions } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const message = await sendDirectMessage({
      conversationId,
      senderId: user.sub,
      content,
      attachments,
      mentions,
    });

    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

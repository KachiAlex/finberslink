import { NextRequest, NextResponse } from 'next/server';
import { subscribeToThread, unsubscribeFromThread, listUserThreadSubscriptions } from '@/features/forum/service';

// POST /api/forum/subscriptions - subscribe to thread
export async function POST(req: NextRequest) {
  const { userId, threadId } = await req.json();
  if (!userId || !threadId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const sub = await subscribeToThread(userId, threadId);
  return NextResponse.json(sub);
}

// DELETE /api/forum/subscriptions - unsubscribe from thread
export async function DELETE(req: NextRequest) {
  const { userId, threadId } = await req.json();
  if (!userId || !threadId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  await unsubscribeFromThread(userId, threadId);
  return NextResponse.json({ success: true });
}

// GET /api/forum/subscriptions?userId=xxx - list user subscriptions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const subs = await listUserThreadSubscriptions(userId);
  return NextResponse.json(subs);
}

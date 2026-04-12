import { NextRequest, NextResponse } from 'next/server';
import { addPostReaction, removePostReaction, listPostReactions } from "@/features/forum/service";

// POST /api/forum/posts/reactions - add reaction
export async function POST(req: NextRequest) {
  const { postId, userId, type } = await req.json();
  if (!postId || !userId || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const reaction = await addPostReaction({ postId, userId, type });
  return NextResponse.json(reaction);
}

// DELETE /api/forum/posts/reactions - remove reaction
export async function DELETE(req: NextRequest) {
  const { postId, userId, type } = await req.json();
  if (!postId || !userId || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  await removePostReaction({ postId, userId, type });
  return NextResponse.json({ success: true });
}

// GET /api/forum/posts/reactions?postId=xxx - list reactions for a post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
  }
  const reactions = await listPostReactions(postId);
  return NextResponse.json(reactions);
}

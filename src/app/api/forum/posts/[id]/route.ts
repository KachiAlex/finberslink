import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/forum/posts/[id] - edit post (author or admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { content, userId, isAdmin } = await req.json();
  if (!content || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Only author or admin can edit
  const post = await prisma.forumPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (post.authorId !== userId && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Record edit history before updating
  try {
    await prisma.forumPostEdit.create({
      data: {
        postId: params.id,
        editorId: userId,
        previousContent: post.content,
        newContent: content,
      },
    });
  } catch (e) {
    console.error('Failed to record post edit', e);
  }

  const updated = await prisma.forumPost.update({ where: { id: params.id }, data: { content, editedAt: new Date() } });
  return NextResponse.json({ post: updated });
}

// DELETE /api/forum/posts/[id] - delete post (author or admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, isAdmin } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const post = await prisma.forumPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (post.authorId !== userId && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await prisma.forumPost.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}

// POST /api/forum/posts/[id]/report - report/flag post
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, reason } = await req.json();
  if (!userId || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // For demo: just log the report, in production save to DB and notify admin
  console.log(`User ${userId} reported post ${params.id}: ${reason}`);
  return NextResponse.json({ success: true });
}

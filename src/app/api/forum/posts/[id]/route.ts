import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// PATCH /api/forum/posts/[id] - edit post (author or admin)
export async function PATCH(req: NextRequest, context: any) {
  const params = (context && context.params) ? (await context.params) : (context?.params);
  const id = params?.id || (context?.params?.id);
  const { content, userId, isAdmin } = await req.json();
  if (!content || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Only author or admin can edit
  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (post.authorId !== userId && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Record edit history before updating
  try {
    await prisma.forumPostEdit.create({
      data: {
        postId: id,
        editorId: userId,
        previousContent: post.content,
        newContent: content,
      },
    });
  } catch (e) {
    console.error('Failed to record post edit', e);
  }

  const updated = await prisma.forumPost.update({ where: { id }, data: { content, editedAt: new Date() } });
  return NextResponse.json({ post: updated });
}

// DELETE /api/forum/posts/[id] - delete post (author or admin)
export async function DELETE(req: NextRequest, context: any) {
  const params = (context && context.params) ? (await context.params) : (context?.params);
  const id = params?.id || (context?.params?.id);
  const { userId, isAdmin } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (post.authorId !== userId && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await prisma.forumPost.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}

// POST /api/forum/posts/[id]/report - report/flag post
export async function POST(req: NextRequest, context: any) {
  const params = (context && context.params) ? (await context.params) : (context?.params);
  const id = params?.id || (context?.params?.id);
  const { userId, reason } = await req.json();
  if (!userId || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // For demo: just log the report, in production save to DB and notify admin
  console.log(`User ${userId} reported post ${id}: ${reason}`);
  return NextResponse.json({ success: true });
}

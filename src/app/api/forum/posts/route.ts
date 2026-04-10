import { NextRequest, NextResponse } from 'next/server';
import { createForumPost, listThreadPosts, listPostReplies } from '../../../features/forum/service';

// GET /api/forum/posts?threadId=xxx - list top-level posts for a thread
// GET /api/forum/posts?parentId=xxx - list replies to a post
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    const parentId = searchParams.get('parentId');
    const cursor = searchParams.get('cursor');
    const limit = searchParams.get('limit');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    
    if (threadId) {
      const posts = await listThreadPosts(threadId, { 
        limit: limit ? parseInt(limit) : undefined,
        cursor: cursor || undefined,
        isAdmin 
      });
      return NextResponse.json({ posts });
    }
    if (parentId) {
      const replies = await listPostReplies(parentId, { isAdmin });
      return NextResponse.json({ replies });
    }
    return NextResponse.json({ error: 'Missing threadId or parentId' }, { status: 400 });
  } catch (error) {
    console.error('Forum posts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/forum/posts - create a post or reply
export async function POST(req: NextRequest) {
  try {
    const { content, threadId, authorId, parentId, mentions } = await req.json();
    if (!content || !threadId || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const post = await createForumPost({ content, threadId, authorId, parentId, mentions });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

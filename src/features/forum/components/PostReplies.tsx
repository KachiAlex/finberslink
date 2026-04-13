import { usePostReplies } from '@/hooks/usePostReplies';
import { PostReactions } from './PostReactions';
import React from 'react';
import RW from 'react-window/dist/react-window.cjs';
const List = (RW as any).FixedSizeList as any;

export function PostReplies({ postId, userId }: { postId: string; userId: string }) {
  const { replies, loading, error } = usePostReplies(postId);

  if (loading) return <div className="ml-8 text-xs text-gray-400">Loading replies...</div>;
  if (error) return <div className="ml-8 text-xs text-red-600">{error}</div>;
  if (!replies.length) return null;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const reply = replies[index];
    return (
      <div style={style} className="px-0">
        <div key={reply.id} className="border rounded p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
              {(reply.author?.firstName?.[0] ?? 'U')}{(reply.author?.lastName?.[0] ?? 'N')}
            </div>
            <div>
              <div className="text-xs font-semibold">{reply.author?.firstName ?? 'Unknown'} {reply.author?.lastName ?? 'User'}</div>
              <div className="text-xs text-gray-500">{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : ''}</div>
            </div>
          </div>
          <div className="prose prose-slate max-w-none mb-1">
            <p className="text-slate-700 leading-relaxed">{reply.content}</p>
          </div>
          <PostReactions postId={reply.id} userId={userId} />
        </div>
      </div>
    );
  };

  return (
    <div className="ml-8 mt-2">
      <List
        height={Math.min(400, replies.length * 110)}
        itemCount={replies.length}
        itemSize={110}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}

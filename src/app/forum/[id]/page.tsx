"use client";
import { useState, useEffect } from "react";
import { ThreadSubscribeButton } from "@/features/forum/components/ThreadSubscribeButton";
import { PostReactions } from "@/features/forum/components/PostReactions";
import { PostModerationButtons } from "@/features/forum/components/PostModerationButtons";
import useSWR from 'swr';
import { useSWRPosts } from "@/features/forum/hooks/useSWRPosts";
import { PostReplies } from "@/features/forum/components/PostReplies";
import { MentionTextarea } from '@/features/forum/components/MentionTextarea';
import React from 'react';
import RW from 'react-window/dist/react-window.cjs';
const List = (RW as any).FixedSizeList as any;

export default function ForumThreadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const userId = "demo-user-id"; // Replace with actual userId from session/auth
  const isAdmin = true; // Set to true to simulate admin view
  const [thread, setThread] = useState<any>(null);
  const { posts, loading: postsLoading, hasMore, loadMore } = useSWRPosts(id, 10);
  const [reply, setReply] = useState("");

  useEffect(() => {
    fetch(`/api/forum/threads?id=${id}`)
      .then(res => res.json())
      .then(data => setThread(data.thread || data));
  }, [id]);

  if (!thread) return <div className="max-w-2xl mx-auto py-12">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{thread.title}</h1>
        <div className="flex gap-2 flex-wrap mb-2">
          {thread.tags?.map((tag: string) => (
            <span key={tag} className="bg-gray-200 px-2 py-0.5 rounded text-xs">{tag}</span>
          ))}
        </div>
        <div className="text-xs text-gray-500 mb-2">
          By {thread.author?.firstName ?? "Unknown"} {thread.author?.lastName ?? "User"} · {thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : ""}
        </div>
        <ThreadSubscribeButton userId={userId} threadId={thread.id} />
      </div>
      <div className="space-y-6 mb-8">
        {postsLoading && posts.length === 0 ? (
          <div>Loading posts...</div>
        ) : (
          <>
            <List
              height={Math.min(800, posts.length * 220)}
              itemCount={posts.length}
              itemSize={220}
              width="100%"
            >
              {({ index, style }: { index: number; style: React.CSSProperties }) => {
                const post = posts[index];
                return (
                  <div style={style} className="px-0">
                    <div key={post.id} className={`border rounded p-4 ${post.deletedAt ? 'bg-red-50 opacity-70' : 'bg-white'}`}>
                      {post.deletedAt && isAdmin ? (
                        <div className="text-xs text-red-700 mb-2">[Deleted post - visible to admin]</div>
                      ) : null}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                          {(post.author?.firstName?.[0] ?? "U")}{(post.author?.lastName?.[0] ?? "N")}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{post.author?.firstName ?? "Unknown"} {post.author?.lastName ?? "User"}</div>
                          <div className="text-xs text-gray-500">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</div>
                        </div>
                      </div>
                      <div className="prose prose-slate max-w-none mb-2">
                        <p className="text-slate-700 leading-relaxed">{post.content}</p>
                      </div>
                      <PostReactions postId={post.id} userId={userId} />
                      <PostModerationButtons postId={post.id} userId={userId} isAuthor={post.author?.id === userId} isAdmin={isAdmin} />
                      {/* Nested replies */}
                      <PostReplies postId={post.id} userId={userId} />
                    </div>
                  </div>
                );
              }}
            </List>
            {hasMore && (
              <div className="flex justify-center mt-4">
                <button onClick={loadMore} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Load more posts</button>
              </div>
            )}
          </>
        )}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          // TODO: Call API to post reply, then refresh posts
          setReply("");
        }}
        className="border rounded p-4 bg-white"
      >
        <MentionTextarea value={reply} onChange={setReply} placeholder="Write a reply..." />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Reply</button>
      </form>
    </div>
  );
}

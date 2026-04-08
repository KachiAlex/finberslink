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
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { posts, loading: postsLoading, hasMore, loadMore, mutate } = useSWRPosts(id, 10);

  useEffect(() => {
    fetch(`/api/forum/threads?id=${id}`)
      .then(res => res.json())
      .then(data => setThread(data.thread || data));
  }, [id]);

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.slice(1)) : [];
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reply.trim()) {
      setSubmitError("Please enter a reply");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const mentions = extractMentions(reply);
      
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reply.trim(),
          threadId: id,
          authorId: userId,
          mentions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post reply');
      }

      const newPost = await response.json();
      
      // Clear the reply form
      setReply("");
      
      // Refresh the posts list
      mutate();
      
      // Show success feedback (you could add a toast here)
      console.log('Reply posted successfully:', newPost);
      
    } catch (error) {
      console.error('Error posting reply:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <form onSubmit={handleSubmitReply} className="border rounded p-4 bg-white">
        <div className="mb-3">
          <MentionTextarea 
            value={reply} 
            onChange={setReply} 
            placeholder="Write a reply... (Use @ to mention users)" 
          />
        </div>
        
        {submitError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {submitError}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <button 
            type="submit" 
            disabled={isSubmitting || !reply.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Reply'}
          </button>
          
          {isSubmitting && (
            <span className="text-sm text-gray-500">Posting your reply...</span>
          )}
        </div>
      </form>
    </div>
  );
}

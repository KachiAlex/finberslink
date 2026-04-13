"use client";

import { useState, useEffect } from "react";
import { ThreadSubscribeButton } from "@/components/forum/ThreadSubscribeButton";
import { PostReactions } from "@/components/forum/PostReactions";
import { PostModerationButtons } from "@/components/forum/PostModerationButtons";
import { PostReplies } from "@/components/forum/PostReplies";
import { PostContent } from "@/components/forum/PostContent";

export function ForumThreadClient({ threadId, userId, isAdmin }: any) {
  const [thread, setThread] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    // Load thread data
    fetch(`/api/forum/threads?id=${threadId}`)
      .then(res => res.json())
      .then(data => setThread(data.thread || data))
      .catch(err => console.error("Failed to load thread:", err));

    // Load posts
    fetch(`/api/forum/posts?threadId=${threadId}`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(err => console.error("Failed to load posts:", err))
      .finally(() => setPostsLoading(false));
  }, [threadId]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reply.trim()) {
      setSubmitError("Please enter a reply");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/forum/replies?threadId=${threadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reply.trim(),
          threadId: threadId,
          authorId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post reply');
      }

      setReply("");
      
      // Refresh posts
      const postsRes = await fetch(`/api/forum/posts?threadId=${threadId}`);
      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);
      
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
        <div className="text-xs text-gray-500 mb-2">
          By {thread.author?.firstName ?? "Unknown"} {thread.author?.lastName ?? "User"} · {thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : ""}
        </div>
        <ThreadSubscribeButton threadId={thread.id} />
      </div>

      <div className="space-y-6 mb-8">
        {postsLoading ? (
          <div>Loading posts...</div>
        ) : (
          posts.map((post: any) => (
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
              <div className="mb-2">
                <PostContent content={post.content} />
              </div>
              <PostReactions postId={post.id} />
              <PostModerationButtons postId={post.id} />
              <PostReplies postId={post.id} />
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmitReply} className="border rounded bg-white p-4">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply..."
          className="w-full p-2 border rounded mb-2"
          rows={4}
        />
        
        {submitError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {submitError}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={() => setReply('')}
            className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm"
          >
            Clear
          </button>
          
          <button 
            type="submit" 
            disabled={isSubmitting || !reply.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </form>
    </div>
  );
}

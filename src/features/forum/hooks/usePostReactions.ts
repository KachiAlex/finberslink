import { useState } from 'react';

export function usePostReactions(postId: string) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchReactions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forum/posts/reactions?postId=${postId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reactions');
      setReactions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addReaction(userId: string, type: string) {
    setLoading(true);
    setError(null);
    // Optimistically update UI
    setReactions(prev => [...prev, { postId, userId, type, createdAt: new Date().toISOString() }]);
    try {
      const res = await fetch('/api/forum/posts/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId, type }),
      });
      if (!res.ok) throw new Error('Failed to add reaction');
      await fetchReactions();
    } catch (e: any) {
      setError(e.message);
      // Rollback optimistic update
      setReactions(prev => prev.filter(r => !(r.userId === userId && r.type === type)));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function removeReaction(userId: string, type: string) {
    setLoading(true);
    setError(null);
    // Optimistically update UI
    setReactions(prev => prev.filter(r => !(r.userId === userId && r.type === type)));
    try {
      const res = await fetch('/api/forum/posts/reactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId, type }),
      });
      if (!res.ok) throw new Error('Failed to remove reaction');
      await fetchReactions();
    } catch (e: any) {
      setError(e.message);
      // Rollback optimistic update
      setReactions(prev => [...prev, { postId, userId, type, createdAt: new Date().toISOString() }]);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { reactions, fetchReactions, addReaction, removeReaction, loading, error };
}

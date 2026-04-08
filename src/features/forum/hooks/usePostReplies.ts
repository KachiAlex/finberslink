import { useState, useEffect } from 'react';

export function usePostReplies(postId: string) {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/forum/posts?parentId=${postId}`)
      .then(res => res.json())
      .then(data => setReplies(data.replies || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [postId]);

  return { replies, loading, error };
}

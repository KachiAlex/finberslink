import { useState, useEffect } from 'react';

export function useListThreads({ tag, query }: { tag?: string; query?: string } = {}) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let url = '/api/forum/threads';
    if (query) url = `/api/forum/threads?q=${encodeURIComponent(query)}`;
    else if (tag) url = `/api/forum/threads?tag=${encodeURIComponent(tag)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setThreads(data.threads || data.threads || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tag, query]);

  return { threads, loading, error };
}

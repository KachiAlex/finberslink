import { useState, useEffect, useCallback } from 'react';
import { ForumThread } from '../types';

interface UseListThreadsParams {
  tag?: string;
  query?: string;
  courseId?: string;
  limit?: number;
  includeUnread?: boolean;
  userId?: string;
}

interface UseListThreadsReturn {
  threads: ForumThread[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor?: string;
  loadMore: () => void;
  refetch: () => void;
}

export function useListThreads({ 
  tag, 
  query, 
  courseId, 
  limit = 20, 
  includeUnread = false, 
  userId 
}: UseListThreadsParams = {}): UseListThreadsReturn {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  const fetchThreads = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(courseId && { courseId }),
        ...(includeUnread && userId && { includeUnread: 'true', userId }),
        ...(cursor && { cursor }),
        ...(query && { q: query }),
        ...(tag && { tag }),
      });

      const response = await fetch(`/api/forum/threads?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await response.json();
      
      if (cursor) {
        setThreads(prev => [...prev, ...data.threads]);
      } else {
        setThreads(data.threads || []);
      }
      
      setHasMore(data.hasMore || false);
      setNextCursor(data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [query, tag, courseId, limit, includeUnread, userId]);

  useEffect(() => {
    // Reset pagination when query or tag changes
    if (query !== currentQuery || tag !== currentTag) {
      setCurrentQuery(query || '');
      setCurrentTag(tag || '');
      setThreads([]);
      setHasMore(false);
      setNextCursor(undefined);
      fetchThreads();
    }
  }, [query, tag, currentQuery, currentTag, fetchThreads]);

  const loadMore = useCallback(() => {
    if (hasMore && nextCursor && !loading) {
      fetchThreads(nextCursor);
    }
  }, [hasMore, nextCursor, loading, fetchThreads]);

  const refetch = useCallback(() => {
    setThreads([]);
    setHasMore(false);
    setNextCursor(undefined);
    fetchThreads();
  }, [fetchThreads]);

  return { 
    threads, 
    loading, 
    error, 
    hasMore, 
    nextCursor, 
    loadMore, 
    refetch 
  };
}

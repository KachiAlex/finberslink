import { useState, useEffect, useCallback } from 'react';
import { ForumThread } from '@/types';

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
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock implementation - replace with actual API call
      const mockThreads: ForumThread[] = [];
      
      setThreads(prev => offset === 0 ? mockThreads : [...prev, ...mockThreads]);
      setHasMore(mockThreads.length === limit);
      setOffset(prev => prev + mockThreads.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threads');
    } finally {
      setLoading(false);
    }
  }, [tag, query, courseId, limit, includeUnread, userId, offset]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchThreads();
    }
  }, [loading, hasMore, fetchThreads]);

  const refetch = useCallback(() => {
    setOffset(0);
    setThreads([]);
    setHasMore(true);
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    threads,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}

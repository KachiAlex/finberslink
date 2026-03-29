import useSWR from 'swr';
import React, { useState, useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useSWRPosts(threadId: string, initialLimit = 10) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const url = threadId
    ? `/api/forum/posts?threadId=${threadId}&limit=${initialLimit}${cursor ? `&cursor=${cursor}` : ''}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { refreshInterval: 5000 });

  // When data changes, append new posts
  useEffect(() => {
    if (data?.posts) {
      if (!cursor) {
        setAllPosts(data.posts);
      } else {
        setAllPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.posts.length === initialLimit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const loadMore = () => {
    if (allPosts.length > 0) {
      setCursor(allPosts[allPosts.length - 1].id);
    }
  };

  const reset = () => {
    setCursor(null);
    setAllPosts([]);
    setHasMore(true);
    mutate();
  };

  return {
    posts: allPosts,
    loading: isLoading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}

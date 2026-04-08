import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useSWRReplies(postId: string) {
  const { data, error, isLoading } = useSWR(
    postId ? `/api/forum/posts?parentId=${postId}` : null,
    fetcher,
    { refreshInterval: 5000 } // Poll every 5 seconds
  );
  return {
    replies: data?.replies || [],
    loading: isLoading,
    error,
  };
}

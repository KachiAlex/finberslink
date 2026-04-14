import { useListThreads } from '@/features/forum/hooks/useListThreads';
import { ForumThread } from '@/types';

interface ThreadListProps {
  tag?: string;
  query?: string;
  onSelect?: (thread: ForumThread) => void;
}

export function ThreadList({ tag, onSelect, query }: ThreadListProps) {
  const { threads, loading, error } = useListThreads({ tag, query });

  if (loading) return <div>Loading threads...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!threads.length) return <div>No threads found.</div>;

  return (
    <ul className="space-y-2">
      {threads.map(thread => (
        <li key={thread.id} className="border p-3 rounded hover:bg-gray-50 cursor-pointer" onClick={() => onSelect?.(thread)}>
          <div className="font-semibold">{thread.title}</div>
          <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
            {thread.tags?.map((tag: string) => (
              <span key={tag} className="bg-gray-200 px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            By {thread.author?.firstName} {thread.author?.lastName} · 
            {thread._count?.posts || 0} posts · 
            {new Date(thread.createdAt).toLocaleDateString()}
          </div>
        </li>
      ))}
    </ul>
  );
}

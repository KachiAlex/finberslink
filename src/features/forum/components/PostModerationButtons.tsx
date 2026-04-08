import { useState } from 'react';
import { useSWRConfig } from 'swr';

export function PostModerationButtons({ postId, userId, isAuthor, isAdmin }: { postId: string; userId: string; isAuthor: boolean; isAdmin?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();
  const [historyVisible, setHistoryVisible] = useState(false);
  const [edits, setEdits] = useState<any[] | null>(null);

  async function handleEdit() {
    setError(null);
    // Optimistically update post content in cache
    mutate((key: string) => key.includes('/api/forum/posts'), (data: any) => {
      if (!data?.posts) return data;
      return {
        ...data,
        posts: data.posts.map((p: any) => p.id === postId ? { ...p, content } : p),
      };
    }, false);
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId, isAdmin }),
      });
      if (!res.ok) throw new Error('Failed to edit post');
      setEditing(false);
      mutate((key: string) => key.includes('/api/forum/posts'));
    } catch (e: any) {
      setError(e.message);
      mutate((key: string) => key.includes('/api/forum/posts'));
    }
  }

  async function handleDelete() {
    setError(null);
    // Optimistically mark post as deleted in cache
    mutate((key: string) => key.includes('/api/forum/posts'), (data: any) => {
      if (!data?.posts) return data;
      return {
        ...data,
        posts: data.posts.map((p: any) => p.id === postId ? { ...p, deletedAt: new Date().toISOString() } : p),
      };
    }, false);
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin }),
      });
      if (!res.ok) throw new Error('Failed to delete post');
      mutate((key: string) => key.includes('/api/forum/posts'));
    } catch (e: any) {
      setError(e.message);
      mutate((key: string) => key.includes('/api/forum/posts'));
    }
  }

  async function handleReport() {
    setError(null);
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;
    try {
      const res = await fetch(`/api/forum/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason }),
      });
      if (!res.ok) throw new Error('Failed to report post');
      alert('Reported!');
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleHistory() {
    if (historyVisible) {
      setHistoryVisible(false);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/forum/posts/${postId}/edits`);
      if (!res.ok) throw new Error('Failed to fetch edit history');
      const data = await res.json();
      setEdits(data.edits || []);
      setHistoryVisible(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      {(isAuthor || isAdmin) && (
        <>
          {editing ? (
            <>
              <input value={content} onChange={e => setContent(e.target.value)} className="border p-1 text-xs" />
              <button onClick={handleEdit} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Save</button>
              <button onClick={() => setEditing(false)} className="text-xs underline">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs underline">Edit</button>
          )}
          <button onClick={handleDelete} className="text-xs text-red-600 underline">Delete</button>
        </>
      )}
      <button onClick={handleReport} className="text-xs text-yellow-600 underline">Report</button>
      <button onClick={toggleHistory} className="text-xs underline">History</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {historyVisible && edits && (
        <div className="w-full mt-2 border rounded bg-white p-2 text-xs">
          {edits.length === 0 ? (
            <div className="text-gray-500">No edits</div>
          ) : (
            <ul className="space-y-2">
              {edits.map(e => (
                <li key={e.id} className="border p-2 rounded">
                  <div className="text-xs text-gray-600">Edited by {e.editor?.firstName ?? 'Unknown'} {e.editor?.lastName ?? ''} · {new Date(e.createdAt).toLocaleString()}</div>
                  <div className="mt-1 text-gray-800"><strong>Before:</strong> {e.previousContent}</div>
                  {e.newContent && <div className="mt-1 text-gray-700"><strong>After:</strong> {e.newContent}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

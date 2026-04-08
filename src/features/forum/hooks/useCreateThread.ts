import { useState } from 'react';

export function useCreateThread() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<any>(null);

  async function createThread({ title, courseId, tags, content }: { title: string; courseId: string; tags?: string[]; content?: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, courseId, tags, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create thread');
      setThread(data.thread);
      return data.thread;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { createThread, loading, error, thread };
}

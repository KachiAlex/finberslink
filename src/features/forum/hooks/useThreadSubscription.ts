import { useState } from 'react';

export function useThreadSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(userId: string, threadId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forum/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, threadId }),
      });
      if (!res.ok) throw new Error('Failed to subscribe');
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe(userId: string, threadId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forum/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, threadId }),
      });
      if (!res.ok) throw new Error('Failed to unsubscribe');
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { subscribe, unsubscribe, loading, error };
}

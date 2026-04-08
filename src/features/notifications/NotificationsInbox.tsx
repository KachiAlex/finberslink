import React, { useEffect, useState } from 'react';

export function NotificationsInbox({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/notifications?userId=${userId}`)
      .then(res => res.json())
      .then(data => setNotifications(data.notifications || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;
  if (loading) return <div className="p-2">Loading notifications...</div>;
  if (error) return <div className="p-2 text-red-600">{error}</div>;
  if (!notifications || notifications.length === 0) return <div className="p-2 text-gray-500">No notifications</div>;

  return (
    <div className="w-full max-w-md border rounded bg-white p-2">
      <ul className="space-y-2 text-sm">
        {notifications.map(n => (
          <li key={n.id} className="border-b pb-2">
            <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
            <div className="mt-1">{n.type}: {typeof n.payload === 'string' ? n.payload : JSON.stringify(n.payload)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

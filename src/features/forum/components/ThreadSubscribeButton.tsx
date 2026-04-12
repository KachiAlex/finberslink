"use client";

import { useThreadSubscription } from '../hooks/useThreadSubscription';
import { useState } from 'react';

export function ThreadSubscribeButton({ userId, threadId, initiallySubscribed }: { userId: string; threadId: string; initiallySubscribed?: boolean }) {
  const { subscribe, unsubscribe, loading } = useThreadSubscription();
  const [subscribed, setSubscribed] = useState(!!initiallySubscribed);

  const handleClick = async () => {
    if (subscribed) {
      await unsubscribe(userId, threadId);
      setSubscribed(false);
    } else {
      await subscribe(userId, threadId);
      setSubscribed(true);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={`px-3 py-1 rounded ${subscribed ? 'bg-gray-300' : 'bg-blue-500 text-white'}`}>
      {subscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  );
}

import { useEffect } from 'react';
import { usePostReactions } from '../hooks/usePostReactions';

const REACTION_TYPES = ['like', 'upvote', 'laugh', 'clap'];

export function PostReactions({ postId, userId }: { postId: string; userId: string }) {
  const { reactions, fetchReactions, addReaction, removeReaction, loading, error } = usePostReactions(postId);

  useEffect(() => {
    fetchReactions();
    // eslint-disable-next-line
  }, [postId]);

  const userReactions = reactions.filter(r => r.userId === userId).map(r => r.type);

  return (
    <div className="flex gap-2 items-center">
      {REACTION_TYPES.map(type => (
        <button
          key={type}
          className={`px-2 py-1 rounded border ${userReactions.includes(type) ? 'bg-blue-200' : ''}`}
          disabled={loading}
          onClick={() => userReactions.includes(type) ? removeReaction(userId, type) : addReaction(userId, type)}
        >
          {type} {reactions.filter(r => r.type === type).length}
        </button>
      ))}
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </div>
  );
}

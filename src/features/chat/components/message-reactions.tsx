"use client";

import { useState, useEffect } from "react";
import { Heart, ThumbsUp, Laugh, Smile, Frown, Angry } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatWebSocket } from "../services/websocket-manager";

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  user?: {
    firstName: string | null;
    lastName: string | null;
  };
}

const REACTION_EMOJIS = {
  love: { emoji: 'heart', icon: Heart, color: 'text-red-500' },
  like: { emoji: 'thumbsup', icon: ThumbsUp, color: 'text-blue-500' },
  laugh: { emoji: 'laugh', icon: Laugh, color: 'text-yellow-500' },
  wow: { emoji: 'wow', icon: Smile, color: 'text-purple-500' },
  sad: { emoji: 'sad', icon: Frown, color: 'text-blue-600' },
  angry: { emoji: 'angry', icon: Angry, color: 'text-red-600' }
};

export function MessageReactions({ messageId, currentUserId }: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { on, sendReaction } = useChatWebSocket(null);

  useEffect(() => {
    if (!on) return;

    // Listen for reaction events
    const unsubscribeReaction = on('reaction', (data: any) => {
      if (data.messageId !== messageId) return;

      const { type, reaction } = data;
      
      if (type === 'added') {
        setReactions(prev => [...prev, reaction]);
      } else if (type === 'removed') {
        setReactions(prev => prev.filter(r => r.id !== reaction.id));
      }
    });

    // Fetch existing reactions for this message
    fetchReactions();

    return () => {
      unsubscribeReaction();
    };
  }, [on, messageId]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/reactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(r => 
        r.userId === currentUserId && r.emoji === reactionType
      );

      if (existingReaction) {
        // Remove reaction
        await removeReaction(existingReaction.id);
      } else {
        // Add reaction
        await addReaction(reactionType);
      }
      
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to handle reaction:', error);
    }
  };

  const addReaction = async (emoji: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const newReaction = await response.json();
        setReactions(prev => [...prev, newReaction]);
        
        // Send real-time update
        if (sendReaction) {
          sendReaction(messageId, { type: 'added', reaction: newReaction });
        }
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const removeReaction = async (reactionId: string) => {
    try {
      const response = await fetch(`/api/chat/reactions/${reactionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setReactions(prev => prev.filter(r => r.id !== reactionId));
        
        // Send real-time update
        if (sendReaction) {
          sendReaction(messageId, { type: 'removed', reaction: { id: reactionId } });
        }
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  if (Object.keys(groupedReactions).length === 0) {
    return (
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Heart className="w-4 h-4" />
        </Button>
        
        {showEmojiPicker && (
          <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 mt-1">
            <div className="flex space-x-1">
              {Object.entries(REACTION_EMOJIS).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction(key)}
                    className={`p-2 hover:bg-gray-100 ${config.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => {
        const config = REACTION_EMOJIS[emoji as keyof typeof REACTION_EMOJIS];
        const Icon = config?.icon;
        const hasUserReacted = emojiReactions.some(r => r.userId === currentUserId);
        
        return (
          <Button
            key={emoji}
            variant={hasUserReacted ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleReaction(emoji)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs ${
              hasUserReacted ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
            }`}
          >
            {Icon && <Icon className={`w-3 h-3 ${config.color}`} />}
            <span>{emojiReactions.length}</span>
          </Button>
        );
      })}
      
      {/* Add reaction button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="text-gray-400 hover:text-gray-600 px-2 py-1"
      >
        <span className="text-lg">+</span>
      </Button>
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 mt-1">
          <div className="flex space-x-1">
            {Object.entries(REACTION_EMOJIS).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(key)}
                  className={`p-2 hover:bg-gray-100 ${config.color}`}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

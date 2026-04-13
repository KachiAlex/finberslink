"use client";

import { useState, useEffect } from "react";
import { useChatWebSocket } from "@/features/chat/services/websocket-manager";
import { Avatar } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  threadId?: string | null;
  conversationId?: string | null;
  currentUserId: string;
}

interface TypingUser {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  isTyping: boolean;
  lastTyped: Date;
}

export function TypingIndicator({ threadId, conversationId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // WebSocket connection for typing indicators
  const { on, sendTypingIndicator } = useChatWebSocket(null);

  useEffect(() => {
    if (!on) return;

    // Listen for typing events
    const unsubscribeTyping = on('typing', (data: any) => {
      const { userId, isTyping, threadId: eventThreadId, conversationId: eventConversationId } = data;
      
      // Only process typing events for current thread/conversation
      const isRelevant = 
        (threadId && eventThreadId === threadId) ||
        (conversationId && eventConversationId === conversationId);
      
      if (!isRelevant || userId === currentUserId) return;

      setTypingUsers(prev => {
        if (isTyping) {
          // Add or update typing user
          const existing = prev.find(u => u.userId === userId);
          if (existing) {
            return prev.map(u => 
              u.userId === userId 
                ? { ...u, isTyping: true, lastTyped: new Date() }
                : u
            );
          } else {
            return [...prev, {
              userId,
              firstName: data.user?.firstName || null,
              lastName: data.user?.lastName || null,
              isTyping: true,
              lastTyped: new Date()
            }];
          }
        } else {
          // Remove typing user
          return prev.filter(u => u.userId !== userId);
        }
      });
    });

    return () => {
      unsubscribeTyping();
    };
  }, [on, threadId, conversationId, currentUserId]);

  // Clean up typing users who haven't typed in a while
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => 
        prev.filter(user => {
          const timeSinceLastTyped = Date.now() - user.lastTyped.getTime();
          return timeSinceLastTyped < 10000; // Remove after 10 seconds
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    const names = typingUsers.map(u => 
      u.firstName || 'Someone'
    );
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing...`;
    }
  };

  return (
    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((user, index) => (
            <Avatar key={user.userId} className="w-6 h-6 border-2 border-white">
              <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                {user.firstName?.[0] || 'S'}
              </div>
            </Avatar>
          ))}
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-gray-600 italic">
            {getTypingText()}
          </span>
        </div>
      </div>
    </div>
  );
}

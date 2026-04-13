import { useEffect, useRef, useState } from 'react';
import { ForumPost, ForumThread } from '@/types';

interface RealtimeEvent {
  type: 'thread_created' | 'thread_updated' | 'post_created' | 'post_updated' | 'post_deleted';
  data: ForumThread | ForumPost;
  timestamp: string;
}

interface UseRealtimeForumOptions {
  threadId?: string;
  courseId?: string;
  onThreadCreated?: (thread: ForumThread) => void;
  onThreadUpdated?: (thread: ForumThread) => void;
  onPostCreated?: (post: ForumPost) => void;
  onPostUpdated?: (post: ForumPost) => void;
  onPostDeleted?: (post: ForumPost) => void;
}

export function useRealtimeForum(options: UseRealtimeForumOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams();
    if (options.threadId) params.append('threadId', options.threadId);
    if (options.courseId) params.append('courseId', options.courseId);

    const url = `/api/forum/realtime?${params.toString()}`;
    
    try {
      eventSourceRef.current = new EventSource(url);
      
      eventSourceRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Forum SSE connection opened');
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const eventData: RealtimeEvent = JSON.parse(event.data);
          setLastEvent(eventData);

          // Call appropriate event handlers
          switch (eventData.type) {
            case 'thread_created':
              options.onThreadCreated?.(eventData.data as ForumThread);
              break;
            case 'thread_updated':
              options.onThreadUpdated?.(eventData.data as ForumThread);
              break;
            case 'post_created':
              options.onPostCreated?.(eventData.data as ForumPost);
              break;
            case 'post_updated':
              options.onPostUpdated?.(eventData.data as ForumPost);
              break;
            case 'post_deleted':
              options.onPostDeleted?.(eventData.data as ForumPost);
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect SSE...');
          connect();
        }, 5000);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [options.threadId, options.courseId]);

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
    disconnect,
  };
}

// Hook for thread-specific real-time updates
export function useRealtimeThread(threadId: string, onNewPost?: (post: ForumPost) => void) {
  return useRealtimeForum({
    threadId,
    onPostCreated: onNewPost,
  });
}

// Hook for course-specific real-time updates
export function useRealtimeCourse(courseId: string, onThreadActivity?: (thread: ForumThread) => void) {
  return useRealtimeForum({
    courseId,
    onThreadCreated: onThreadActivity,
    onThreadUpdated: onThreadActivity,
  });
}

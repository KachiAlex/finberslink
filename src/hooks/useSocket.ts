import { useEffect, useRef, useCallback } from 'react';

export default function useSocket(url?: string) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;

    try {
      socketRef.current = new WebSocket(url);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url]);

  const send = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  return {
    socket: socketRef.current,
    send,
  };
}

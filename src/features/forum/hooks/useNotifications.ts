import { useState, useEffect, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'MENTION' | 'THREAD_REPLY' | 'THREAD_SUBSCRIPTION';
  userId: string;
  payload: {
    threadId?: string;
    postId?: string;
    snippet?: string;
    threadTitle?: string;
    authorName?: string;
  };
  read: boolean;
  createdAt: Date;
}

interface UseNotificationsOptions {
  userId?: string;
  autoMarkAsRead?: boolean;
}

export function useNotifications({ userId, autoMarkAsRead = true }: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [userId]);

  // Auto-mark notifications as read when viewed
  useEffect(() => {
    if (autoMarkAsRead && notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        const timer = setTimeout(() => {
          unreadNotifications.forEach(notification => {
            markAsRead(notification.id);
          });
        }, 3000); // Mark as read after 3 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [notifications, autoMarkAsRead, markAsRead]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

// Hook for notification badge
export function useNotificationBadge(userId?: string) {
  const { unreadCount } = useNotifications({ userId, autoMarkAsRead: false });

  return {
    count: unreadCount,
    show: unreadCount > 0,
    label: unreadCount > 99 ? '99+' : unreadCount.toString(),
  };
}

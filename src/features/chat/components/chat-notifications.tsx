"use client";

import { useState, useEffect } from "react";
import { useChatMessages } from "../hooks";
import { Bell, MessageCircle, Users, Hash, X, Check, CheckCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar } from "../../../components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { listChatNotifications } from "../service";

interface Notification {
  id: string;
  type: 'mention' | 'reply' | 'announcement' | 'thread_created' | 'message';
  title: string;
  content: string;
  threadId?: string;
  conversationId?: string;
  messageId?: string;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
  read: boolean;
}

export function ChatNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  // Mock notifications - replace with actual API call
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock notifications
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'mention',
            title: 'You were mentioned',
            content: '@john mentioned you in "JavaScript Assignment Help"',
            threadId: 'thread1',
            messageId: 'msg1',
            author: {
              id: 'user1',
              firstName: 'Sarah',
              lastName: 'Johnson'
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            read: false
          },
          {
            id: '2',
            type: 'reply',
            title: 'New reply to your message',
            content: 'Mike replied to your message in "Study Group"',
            threadId: 'thread2',
            messageId: 'msg2',
            author: {
              id: 'user2',
              firstName: 'Mike',
              lastName: 'Wilson'
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: false
          },
          {
            id: '3',
            type: 'announcement',
            title: 'New announcement',
            content: 'Course instructor posted an announcement in "Advanced JavaScript"',
            threadId: 'thread3',
            author: {
              id: 'user3',
              firstName: 'Dr.',
              lastName: 'Smith'
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
            read: true
          },
          {
            id: '4',
            type: 'message',
            title: 'New direct message',
            content: 'Emma sent you a direct message',
            conversationId: 'conv1',
            messageId: 'msg3',
            author: {
              id: 'user4',
              firstName: 'Emma',
              lastName: 'Davis'
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            read: true
          }
        ];

        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'reply':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'announcement':
        return <Hash className="w-4 h-4 text-purple-500" />;
      case 'thread_created':
        return <Hash className="w-4 h-4 text-orange-500" />;
      case 'message':
        return <Users className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return 'Mention';
      case 'reply':
        return 'Reply';
      case 'announcement':
        return 'Announcement';
      case 'thread_created':
        return 'New Thread';
      case 'message':
        return 'Direct Message';
      default:
        return 'Notification';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllAsRead(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-lg">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={markingAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500">
                You don't have any notifications yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-all ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {notification.author && (
                              <>
                                <Avatar className="w-4 h-4">
                                  <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                    {notification.author.firstName?.[0] || 'U'}
                                  </div>
                                </Avatar>
                                <span className="text-xs text-gray-500">
                                  {notification.author.firstName} {notification.author.lastName}
                                </span>
                              </>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Reply, MoreHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dialog";
import { MessageReactions } from "./message-reactions";
import { TypingIndicator } from "./typing-indicator";

interface ThreadedMessage {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
  };
  sentAt: string;
  editedAt?: string;
  parentId?: string;
  threadId?: string;
  attachments?: any[];
  mentions?: string[];
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  }>;
  replies?: ThreadedMessage[];
  replyCount?: number;
  isThreaded?: boolean;
}

interface ThreadedMessageListProps {
  messages: ThreadedMessage[];
  currentUserId: string;
  onReply: (messageId: string, content: string) => Promise<void>;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  isLoading?: boolean;
  maxDepth?: number;
}

function MessageItem({ 
  message, 
  currentUserId, 
  depth = 0, 
  maxDepth = 3,
  onReply, 
  onEdit, 
  onDelete, 
  onReact,
  isExpanded = true,
  onToggleExpand 
}: {
  message: ThreadedMessage;
  currentUserId: string;
  depth?: number;
  maxDepth?: number;
  onReply: (messageId: string, content: string) => Promise<void>;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const isAuthor = message.authorId === currentUserId;
  const hasReplies = message.replies && message.replies.length > 0;
  const canReply = depth < maxDepth;

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    try {
      await onReply(message.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      await onEdit(message.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getIndentClass = () => {
    const indentClasses = [
      '',
      'ml-6 border-l-2 border-gray-200 pl-4',
      'ml-12 border-l-2 border-gray-300 pl-4',
      'ml-18 border-l-2 border-gray-400 pl-4'
    ];
    return indentClasses[Math.min(depth, indentClasses.length - 1)];
  };

  return (
    <div className={`${getIndentClass()} ${depth > 0 ? 'mt-3' : ''}`}>
      {/* Message Header */}
      <div className="flex items-start space-x-3 group">
        <Avatar className="w-8 h-8 flex-shrink-0">
          {message.author.avatarUrl ? (
            <img src={message.author.avatarUrl} alt="Avatar" />
          ) : (
            <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
              {message.author.firstName?.[0] || 'U'}
            </div>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">
              {message.author.firstName} {message.author.lastName}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.sentAt)}
            </span>
            {message.editedAt && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
            {depth > 0 && (
              <span className="text-xs text-blue-600">reply to {message.parentId}</span>
            )}
          </div>

          {/* Message Content */}
          <div className="mb-2">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-1">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">F</span>
                  </div>
                  <span>{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mb-2">
              <MessageReactions messageId={message.id} currentUserId={currentUserId} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              disabled={!canReply}
              className="text-xs"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>

            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs"
              >
                Edit
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <DropdownMenuItem onClick={() => onDelete(message.id)}>
                    Delete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {hasReplies && onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="text-xs"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 mr-1" />
                ) : (
                  <ChevronRight className="w-3 h-3 mr-1" />
                )}
                {message.replyCount || message.replies?.length || 0} replies
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && canReply && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${message.author.firstName}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleReply}>
                    Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && isExpanded && depth < maxDepth && (
        <div className="mt-3 space-y-3">
          {message.replies?.map((reply) => (
            <MessageItem
              key={reply.id}
              message={reply}
              currentUserId={currentUserId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadedMessageList({
  messages,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  isLoading = false,
  maxDepth = 3
}: ThreadedMessageListProps) {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const messageMap = new Map<string, ThreadedMessage>();
  const rootMessages: ThreadedMessage[] = [];

  // Build message tree
  useEffect(() => {
    messages.forEach(message => {
      messageMap.set(message.id, { ...message, replies: [] });
    });

    // Organize messages into threads
    messages.forEach(message => {
      if (message.parentId) {
        const parent = messageMap.get(message.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(messageMap.get(message.id)!);
        }
      } else {
        rootMessages.push(messageMap.get(message.id)!);
      }
    });

    // Sort messages by date
    const sortByDate = (msgs: ThreadedMessage[]) => {
      msgs.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      msgs.forEach(msg => {
        if (msg.replies) sortByDate(msg.replies);
      });
    };
    sortByDate(rootMessages);
  }, [messages]);

  const toggleThreadExpansion = (messageId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rootMessages.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">
            Start the conversation with a message
          </p>
        </div>
      ) : (
        rootMessages.map((message) => (
          <div key={message.id}>
            <MessageItem
              message={message}
              currentUserId={currentUserId}
              maxDepth={maxDepth}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
              isExpanded={expandedThreads.has(message.id)}
              onToggleExpand={() => toggleThreadExpansion(message.id)}
            />
            
            {message.id !== rootMessages[rootMessages.length - 1]?.id && (
              <Separator className="my-4" />
            )}
          </div>
        ))
      )}
    </div>
  );
}

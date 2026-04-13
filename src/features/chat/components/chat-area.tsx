"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DirectConversation } from "@/hooks/use-direct-messages";
import { UserAvatar } from "./user-avatar";
import { ThreadMessageList } from "./thread-message-list";
import { MessageInput } from "./message-input";
import { cn } from "@/lib/utils";
import { sendMessage } from "../service";
import { Info, Phone, Video, Users, Hash, Send, Paperclip, Smile } from "lucide-react";
import { useChatMessages, useConversationMessages } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypingIndicator } from "./typing-indicator";
import { MessageReactions } from "./message-reactions";

interface ChatAreaProps {
  threadId?: string | null;
  conversationId?: string | null;
  currentUserId: string;
  onSendMessage: (content: string, options?: any) => Promise<void>;
  onSendTypingIndicator?: (isTyping: boolean) => void;
  onSendReadReceipt?: (messageId: string) => void;
  isConnected?: boolean;
  className?: string;
}

export function ChatArea({
  threadId,
  conversationId,
  currentUserId,
  onSendMessage,
  onSendTypingIndicator,
  onSendReadReceipt,
  isConnected = true,
  className,
}: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch messages based on type
  const { data: chatMessages = [], isLoading: loadingChatMessages, fetchNextPage, hasNextPage } = useChatMessages(threadId);
  const { data: directMessages = [], isLoading: loadingDirectMessages } = useConversationMessages(conversationId);
  
  const messages = threadId ? chatMessages : directMessages;
  const isLoading = threadId ? loadingChatMessages : loadingDirectMessages;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onSendTypingIndicator?.(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onSendTypingIndicator?.(false);
    }, 3000);
  }, [isTyping, onSendTypingIndicator]);

  const handleTypingStop = useCallback(() => {
    setIsTyping(false);
    onSendTypingIndicator?.(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [onSendTypingIndicator]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    
    try {
      await onSendMessage(message, {
        attachments: attachedFiles,
        parentId: replyingTo?.id,
      });
      
      setMessage('');
      setAttachedFiles([]);
      setReplyingTo(null);
      handleTypingStop();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [message, attachedFiles, replyingTo, onSendMessage, handleTypingStop]);

  const handleFileAttach = useCallback((files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Show empty state if no thread/conversation selected
  if (!threadId && !conversationId) {
    return (
      <div className={cn("flex flex-col items-center justify-center flex-1 bg-slate-50", className)}>
        <div className="text-center space-y-3">
          <div className="h-20 w-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Choose a course chat or direct message from the sidebar to start chatting.
          </p>
        </div>
      </div>
    );
  }

  // For now, we'll use a placeholder header. In a real implementation,
  // you'd fetch the thread/conversation details
  const headerName = threadId ? 'Course Chat' : 'Direct Message';
  const headerSub = isConnected ? 'Connected' : 'Reconnecting...';

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex-shrink-0">
          {threadId ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
          ) : (
            <Avatar className="w-10 h-10">
              <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                DM
              </div>
            </Avatar>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 text-sm leading-tight truncate">
            {headerName}
          </h2>
          <p className="text-xs text-slate-500">{headerSub}</p>
        </div>

        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={msg.id} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                      {msg.author?.firstName?.[0] || 'U'}
                    </div>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {msg.author?.firstName} {msg.author?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.sentAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-900">{msg.content}</p>
                      <MessageReactions messageId={msg.id} currentUserId={currentUserId} />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load more button */}
              {hasNextPage && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchNextPage()}
                    className="mt-4"
                  >
                    Load more messages
                  </Button>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Typing Indicator */}
      <TypingIndicator threadId={threadId} conversationId={conversationId} currentUserId={currentUserId} />

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Replying to {replyingTo.author?.firstName}: {replyingTo.content?.slice(0, 50)}...
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
              ×
            </Button>
          </div>
        </div>
      )}

      {/* File Attachments Preview */}
      {attachedFiles.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-white px-2 py-1 rounded border">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}>
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="sm" className="shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTypingStart();
              }}
              onBlur={handleTypingStop}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
            />
          </div>
          
          <Button variant="ghost" size="sm" className="shrink-0">
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() && attachedFiles.length === 0}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

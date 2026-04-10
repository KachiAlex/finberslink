"use client";

import { useState, useMemo } from "react";
import { Hash, Users, BookOpen, MessageCircle, MoreHorizontal, Pin, Archive } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import type { ChatSpace, DirectConversation } from "../hooks";

type ChatView = 'courses' | 'direct';

interface ChatSidebarProps {
  view: ChatView;
  data: (ChatSpace | DirectConversation)[];
  currentUserId: string;
  selectedThreadId?: string | null;
  selectedConversationId?: string | null;
  onSelectThread: (threadId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function formatLastMessageTime(date: string | Date): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return messageDate.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    return 'now';
  }
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
}

function ChatSidebarItem({
  item,
  isSelected,
  onClick,
  type,
  currentUserId
}: {
  item: ChatSpace | DirectConversation;
  isSelected: boolean;
  onClick: () => void;
  type: ChatView;
  currentUserId: string;
}) {
  const [showActions, setShowActions] = useState(false);

  if (type === 'courses') {
    const space = item as ChatSpace;
    const lastMessage = space.threads?.[0]?.messages?.[0];
    const unreadCount = space._count?.unreadMessages || 0;

    return (
      <div
        className={`p-3 rounded-lg cursor-pointer transition-colors relative group ${
          isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
        }`}
        onClick={onClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 truncate">
                  {space.title}
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {space.course?.title || 'General'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {space._count?.threads || 0} threads
                </span>
              </div>
              {lastMessage && (
                <p className="text-sm text-gray-600 truncate mt-1">
                  {lastMessage.author?.firstName}: {lastMessage.content}
                </p>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="absolute right-2 top-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pin className="w-4 h-4 mr-2" />
                    Pin
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Direct conversation
  const conversation = item as DirectConversation;
  const lastMessage = conversation.messages?.[0];
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  const unreadCount = conversation._count?.unreadMessages || 0;

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-colors relative group ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Avatar className="w-10 h-10">
              {otherParticipant?.user?.avatarUrl ? (
                <img src={otherParticipant.user.avatarUrl} alt="Avatar" />
              ) : (
                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                  {getInitials(otherParticipant?.user?.firstName, otherParticipant?.user?.lastName)}
                </div>
              )}
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 truncate">
                {otherParticipant?.user?.firstName && otherParticipant?.user?.lastName
                  ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
                  : conversation.name || 'Unknown'
                }
              </h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {conversation.type === 'GROUP' ? 'Group' : 'Direct'}
              </Badge>
              {conversation.type === 'GROUP' && (
                <span className="text-xs text-gray-500">
                  {conversation.participants.length} members
                </span>
              )}
            </div>
            {lastMessage && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {lastMessage.sender?.firstName}: {lastMessage.content}
              </p>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pin className="w-4 h-4 mr-2" />
                  Pin
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatSidebar({
  view,
  data,
  currentUserId,
  selectedThreadId,
  selectedConversationId,
  onSelectThread,
  onSelectConversation,
  isLoading = false,
  collapsed = false,
  onToggleCollapse
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => {
      if (view === 'courses') {
        const space = item as ChatSpace;
        return space.title.toLowerCase().includes(query) ||
               space.course?.title.toLowerCase().includes(query);
      } else {
        const conversation = item as DirectConversation;
        return conversation.name?.toLowerCase().includes(query) ||
               conversation.participants.some(p => 
                 p.user?.firstName?.toLowerCase().includes(query) ||
                 p.user?.lastName?.toLowerCase().includes(query)
               );
      }
    });
  }, [data, searchQuery, view]);

  // Separate pinned and unpinned items
  const { pinned, unpinned } = useMemo(() => {
    const pinned = filteredData.filter(item => pinnedItems.includes(item.id));
    const unpinned = filteredData.filter(item => !pinnedItems.includes(item.id));
    return { pinned, unpinned };
  }, [filteredData, pinnedItems]);

  const handleTogglePin = (itemId: string) => {
    setPinnedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (collapsed) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">
            {view === 'courses' ? 'Course Chats' : 'Direct Messages'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Input
            placeholder={`Search ${view === 'courses' ? 'courses' : 'conversations'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Pinned Items */}
            {pinned.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pinned
                </div>
                {pinned.map((item) => (
                  <ChatSidebarItem
                    key={item.id}
                    item={item}
                    isSelected={
                      view === 'courses' 
                        ? selectedThreadId === item.id
                        : selectedConversationId === item.id
                    }
                    onClick={() => {
                      if (view === 'courses') {
                        onSelectThread(item.id);
                      } else {
                        onSelectConversation(item.id);
                      }
                    }}
                    type={view}
                    currentUserId={currentUserId}
                  />
                ))}
                <Separator className="my-2" />
              </>
            )}

            {/* Regular Items */}
            {unpinned.length > 0 ? (
              <>
                {pinned.length > 0 && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {view === 'courses' ? 'Courses' : 'Conversations'}
                  </div>
                )}
                {unpinned.map((item) => (
                  <ChatSidebarItem
                    key={item.id}
                    item={item}
                    isSelected={
                      view === 'courses' 
                        ? selectedThreadId === item.id
                        : selectedConversationId === item.id
                    }
                    onClick={() => {
                      if (view === 'courses') {
                        onSelectThread(item.id);
                      } else {
                        onSelectConversation(item.id);
                      }
                    }}
                    type={view}
                    currentUserId={currentUserId}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {searchQuery ? 'No results found' : `No ${view === 'courses' ? 'courses' : 'conversations'} yet`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          New {view === 'courses' ? 'Course Chat' : 'Conversation'}
        </Button>
      </div>
    </div>
  );
}

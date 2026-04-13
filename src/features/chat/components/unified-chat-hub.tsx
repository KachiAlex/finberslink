"use client";

import { useState, useMemo, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  MessageCircle, 
  Search, 
  Users, 
  BookOpen, 
  Bell, 
  Settings,
  Plus,
  Hash,
  Video,
  Phone
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { ChatSidebar } from "./chat-sidebar";
import { getUnifiedChatData } from "../service";
import { useChatMessages } from "@/hooks";
import { ChatNotifications } from "./chat-notifications";
import { useChatWebSocket } from "@/services/websocket-manager";
import { useChatSpaces, useDirectConversations } from "@/hooks";
import { useCurrentUserId } from "@/components/current-user-provider";

import { ChatArea } from "./chat-area";
import { ChatSearch } from "./chat-search";

interface UnifiedChatHubProps {
  currentUserId?: string;
}

type ChatView = 'courses' | 'direct' | 'search' | 'notifications';

function UnifiedChatHubInner({ currentUserId }: UnifiedChatHubProps) {
  const ctxUserId = useCurrentUserId();
  const effectiveUserId = currentUserId || ctxUserId;
  const [activeView, setActiveView] = useState<ChatView>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // WebSocket connection
  const token = typeof document !== 'undefined' 
    ? document.cookie.match(/access_token=([^;]+)/)?.[1] 
    : null;
  
  const { 
    isConnected, 
    isConnecting, 
    error: wsError,
    subscribe, 
    unsubscribe, 
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    on: addWebSocketListener
  } = useChatWebSocket(token);

  // Data fetching
  const { data: chatSpaces = [], isLoading: loadingSpaces } = useChatSpaces();
  const { data: conversations = [], isLoading: loadingConversations } = useDirectConversations();

  // Memoize active data based on view
  const activeData = useMemo(() => {
    switch (activeView) {
      case 'courses':
        return chatSpaces;
      case 'direct':
        return conversations;
      case 'search':
        return []; // Will be filtered by search component
      case 'notifications':
        return []; // Will be handled by notifications component
      default:
        return [];
    }
  }, [activeView, chatSpaces, conversations]);

  // WebSocket event handlers
  const handleNewMessage = useCallback((message: any) => {
    // Update relevant thread/conversation
    if (activeView === 'courses' && message.threadId) {
      // Refresh course chat threads
    } else if (activeView === 'direct' && message.conversationId) {
      // Refresh direct conversations
    }
  }, [activeView]);

  // Set up WebSocket listeners
  useState(() => {
    const unsubscribeMessage = addWebSocketListener('message', handleNewMessage);
    return unsubscribeMessage;
  });

  const handleSendMessage = useCallback(async (content: string, options: any = {}) => {
    try {
      if (activeView === 'courses' && selectedThreadId) {
        await sendMessage(selectedThreadId, content, options);
      } else if (activeView === 'direct' && selectedConversationId) {
        // Send direct message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [activeView, selectedThreadId, selectedConversationId, sendMessage]);

  const renderMainContent = () => {
    switch (activeView) {
      case 'search':
        return <ChatSearch query={searchQuery} onSelectThread={setSelectedThreadId} onSelectConversation={setSelectedConversationId} />;
      case 'notifications':
        return <ChatNotifications />;
      default:
        return (
          <ChatArea
            threadId={selectedThreadId}
            conversationId={selectedConversationId}
            currentUserId={effectiveUserId}
            onSendMessage={handleSendMessage}
            onSendTypingIndicator={sendTypingIndicator}
            onSendReadReceipt={sendReadReceipt}
            isConnected={isConnected}
          />
        );
    }
  };

  const renderSidebar = () => {
    switch (activeView) {
      case 'search':
        return (
          <div className="p-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Search Results</h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? `Results for "${searchQuery}"` : 'Enter a search term'}
              </p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-4">
            <h3 className="font-semibold mb-4">Notifications</h3>
            <p className="text-sm text-gray-500">Your recent notifications</p>
          </div>
        );
      default:
        return (
          <ChatSidebar
            view={activeView}
            data={activeData}
            currentUserId={effectiveUserId}
            selectedThreadId={selectedThreadId}
            selectedConversationId={selectedConversationId}
            onSelectThread={setSelectedThreadId}
            onSelectConversation={setSelectedConversationId}
            isLoading={activeView === 'courses' ? loadingSpaces : loadingConversations}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        );
    }
  };

  const navigationItems = [
    { id: 'courses', label: 'Courses', icon: BookOpen, count: chatSpaces.length },
    { id: 'direct', label: 'Direct Messages', icon: Users, count: conversations.length },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (!effectiveUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access the chat hub.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              Chat Hub
            </h1>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search messages, threads, or people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setActiveView('search')}
                className="pl-10 pr-4 py-2"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Avatar className="w-8 h-8">
              <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </Avatar>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 mt-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ChatView)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {item.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 transition-all duration-200 flex-shrink-0`}>
          {renderSidebar()}
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-white">
          {renderMainContent()}
        </main>

        {/* Right Panel (optional) */}
        <aside className="w-64 bg-white border-l border-gray-200 hidden lg:block">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Chat Info</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Participants</p>
                <p>View active members</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Shared Files</p>
                <p>Access shared resources</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Actions</p>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Error Toast */}
      {wsError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Connection error: {wsError}
        </div>
      )}
    </div>
  );
}

export function UnifiedChatHub({ currentUserId }: UnifiedChatHubProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedChatHubInner currentUserId={currentUserId} />
    </QueryClientProvider>
  );
}

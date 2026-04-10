"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MessageCircle, Users, Hash, Clock, Filter } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ScrollArea } from "../../components/ui/scroll-area";
import { searchChatMessages } from "../service";
import { useChatMessages } from "../hooks";

interface ChatSearchProps {
  query: string;
  onSelectThread: (threadId: string) => void;
  onSelectConversation: (conversationId: string) => void;
}

interface SearchResult {
  id: string;
  type: 'message' | 'thread' | 'conversation' | 'user';
  title: string;
  content?: string;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
  };
  threadId?: string;
  conversationId?: string;
  createdAt: string;
  relevance?: number;
}

export function ChatSearch({ query, onSelectThread, onSelectConversation }: ChatSearchProps) {
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'messages' | 'threads' | 'conversations' | 'users'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Mock search results - replace with actual API call
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'message',
          title: 'Assignment Help',
          content: 'Can someone help me with the JavaScript assignment? I\'m stuck on the async/await part.',
          author: {
            id: 'user1',
            firstName: 'John',
            lastName: 'Doe'
          },
          threadId: 'thread1',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          relevance: 0.95
        },
        {
          id: '2',
          type: 'thread',
          title: 'JavaScript Study Group',
          content: 'Weekly discussion about JavaScript concepts and best practices',
          threadId: 'thread2',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          relevance: 0.87
        },
        {
          id: '3',
          type: 'conversation',
          title: 'Sarah Johnson',
          content: 'Direct message conversation about project collaboration',
          conversationId: 'conv1',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          relevance: 0.72
        },
        {
          id: '4',
          type: 'user',
          title: 'Mike Wilson',
          content: 'Course instructor for Advanced JavaScript',
          author: {
            id: 'user2',
            firstName: 'Mike',
            lastName: 'Wilson'
          },
          createdAt: new Date().toISOString(),
          relevance: 0.65
        }
      ];

      // Filter by search type
      const filteredResults = searchType === 'all' 
        ? mockResults 
        : mockResults.filter(result => result.type === searchType.slice(0, -1)); // Remove 's' from plural

      // Filter by date
      const dateFilteredResults = filteredResults.filter(result => {
        const resultDate = new Date(result.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            return resultDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return resultDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return resultDate >= monthAgo;
          default:
            return true;
        }
      });

      setSearchResults(dateFilteredResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchType, dateFilter]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'thread':
        return <Hash className="w-4 h-4 text-green-500" />;
      case 'conversation':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-orange-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'message':
        return 'Message';
      case 'thread':
        return 'Thread';
      case 'conversation':
        return 'Conversation';
      case 'user':
        return 'User';
      default:
        return 'Unknown';
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

  const handleResultClick = (result: SearchResult) => {
    if (result.threadId) {
      onSelectThread(result.threadId);
    } else if (result.conversationId) {
      onSelectConversation(result.conversationId);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search messages, threads, conversations, or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="messages">Messages</SelectItem>
              <SelectItem value="threads">Threads</SelectItem>
              <SelectItem value="conversations">Conversations</SelectItem>
              <SelectItem value="users">Users</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Results */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : searchResults.length === 0 && !searchQuery ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search your conversations</h3>
              <p className="text-gray-500">
                Find messages, threads, conversations, or people
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result) => (
                <Card 
                  key={result.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleResultClick(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {highlightText(result.title, searchQuery)}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(result.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(result.createdAt)}</span>
                          </div>
                        </div>
                        
                        {result.content && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {highlightText(result.content, searchQuery)}
                          </p>
                        )}
                        
                        {result.author && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Avatar className="w-4 h-4">
                              <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                {result.author.firstName?.[0] || 'U'}
                              </div>
                            </Avatar>
                            <span className="text-xs text-gray-500">
                              {result.author.firstName} {result.author.lastName}
                            </span>
                          </div>
                        )}
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

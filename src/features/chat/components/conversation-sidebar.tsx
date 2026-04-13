"use client";

import { useState } from "react";
import { Search, Plus, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DirectConversation } from "@/features/chat/hooks/use-direct-messages";
import { ConversationItem } from "./conversation-item";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: DirectConversation[];
  currentUserId: string;
  selectedConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ConversationSidebar({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading,
  className,
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    if (conv.type === "GROUP") {
      return conv.name?.toLowerCase().includes(q);
    }
    const other = conv.participants.find((p) => p.userId !== currentUserId)?.user;
    if (!other) return false;
    return (
      other.firstName.toLowerCase().includes(q) ||
      other.lastName.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={cn(
        "flex flex-col bg-white border-r border-slate-200",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
          {onNewConversation && (
            <button
              onClick={onNewConversation}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="New message"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-full"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-slate-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              {searchTerm
                ? "No conversations match your search"
                : "No conversations yet. Start a new one!"}
            </p>
            {!searchTerm && onNewConversation && (
              <button
                onClick={onNewConversation}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUserId={currentUserId}
              isSelected={conv.id === selectedConversationId}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

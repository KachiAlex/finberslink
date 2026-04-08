"use client";

import { DirectConversation } from "../hooks/use-direct-messages";
import { UserAvatar } from "./user-avatar";
import { ThreadMessageList } from "./thread-message-list";
import { MessageInput } from "./message-input";
import { cn } from "@/lib/utils";
import { DirectMessage } from "../hooks/use-direct-messages";
import { Info, Phone, Video } from "lucide-react";

interface ChatAreaProps {
  conversation: DirectConversation | null | undefined;
  messages: DirectMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isSending?: boolean;
  isLoadingMessages?: boolean;
  className?: string;
}

export function ChatArea({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  isSending,
  isLoadingMessages,
  className,
}: ChatAreaProps) {
  if (!conversation) {
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
          <h3 className="text-lg font-semibold text-slate-700">Your messages</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Select a conversation from the sidebar or start a new one.
          </p>
        </div>
      </div>
    );
  }

  const isGroup = conversation.type === "GROUP";
  const otherParticipant = isGroup
    ? null
    : conversation.participants.find((p) => p.userId !== currentUserId)?.user;

  const headerName = isGroup
    ? conversation.name || "Group Chat"
    : otherParticipant
      ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
      : "Unknown";

  const headerSub = isGroup
    ? `${conversation.participants.length} members`
    : "Tap to view profile";

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shadow-sm">
        {isGroup ? (
          <div className="relative flex-shrink-0 h-10 w-10">
            {conversation.participants.slice(0, 2).map((p, i) => (
              <div
                key={p.userId}
                className={cn(
                  "absolute w-7 h-7 rounded-full border-2 border-white overflow-hidden",
                  i === 0 ? "top-0 left-0 z-10" : "bottom-0 right-0"
                )}
              >
                <UserAvatar
                  avatarUrl={p.user.avatarUrl}
                  firstName={p.user.firstName}
                  lastName={p.user.lastName}
                  size="xs"
                />
              </div>
            ))}
          </div>
        ) : (
          <UserAvatar
            avatarUrl={otherParticipant?.avatarUrl}
            firstName={otherParticipant?.firstName}
            lastName={otherParticipant?.lastName}
            size="md"
          />
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 text-sm leading-tight truncate">
            {headerName}
          </h2>
          <p className="text-xs text-slate-500">{headerSub}</p>
        </div>

        <div className="flex items-center gap-1">
          <button className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
            <Video className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ThreadMessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoadingMessages}
      />

      {/* Input */}
      <MessageInput
        onSend={onSendMessage}
        disabled={isSending}
        placeholder={`Message ${isGroup ? conversation.name || "group" : otherParticipant?.firstName || "…"}`}
      />
    </div>
  );
}

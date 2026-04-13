"use client";

import { DirectConversation } from "@/features/chat/hooks/use-direct-messages";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  conversation: DirectConversation;
  currentUserId: string;
  isSelected?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const isGroup = conversation.type === "GROUP";

  // For DMs, show the other participant
  const otherParticipant = isGroup
    ? null
    : conversation.participants.find((p) => p.userId !== currentUserId)?.user;

  const displayName = isGroup
    ? conversation.name || "Group Chat"
    : otherParticipant
      ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
      : "Unknown";

  const lastMessage = conversation.messages?.[0];
  const lastMessageText = lastMessage
    ? lastMessage.senderId === currentUserId
      ? `You: ${lastMessage.content}`
      : lastMessage.content
    : "No messages yet";

  const unreadCount = conversation.messages?.filter(
    (m) => m.senderId !== currentUserId && !m.reads.some((r) => r.userId === currentUserId)
  ).length ?? 0;

  const timeStr = lastMessage
    ? (() => {
        const d = new Date(lastMessage.sentAt);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 0)
          return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
      })()
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
        isSelected ? "bg-blue-600" : "hover:bg-slate-100"
      )}
    >
      {/* Avatar */}
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

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "font-medium text-sm truncate",
              isSelected ? "text-white" : "text-slate-900"
            )}
          >
            {displayName}
          </span>
          {timeStr && (
            <span
              className={cn(
                "text-xs flex-shrink-0",
                isSelected ? "text-blue-200" : unreadCount ? "text-blue-600 font-semibold" : "text-slate-400"
              )}
            >
              {timeStr}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              "text-xs truncate",
              isSelected ? "text-blue-200" : unreadCount ? "text-slate-900 font-medium" : "text-slate-500"
            )}
          >
            {lastMessageText}
          </p>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

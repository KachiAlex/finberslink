"use client";

import { cn } from "@/lib/utils";
import { DirectMessage } from "@/hooks/use-direct-messages";
import { UserAvatar } from "./user-avatar";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: DirectMessage;
  currentUserId: string;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export function MessageBubble({
  message,
  currentUserId,
  showAvatar = true,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const isMine = message.senderId === currentUserId;
  const isDeleted = !!message.deletedAt;

  const readByOthers = message.reads.some((r) => r.userId !== currentUserId);

  const timeStr = new Date(message.sentAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMine ? "flex-row-reverse" : "flex-row",
        !isLastInGroup && "mb-0.5"
      )}
    >
      {/* Avatar (only for others, shown at bottom of group) */}
      {!isMine && (
        <div className="w-8 flex-shrink-0">
          {isLastInGroup && showAvatar ? (
            <UserAvatar
              avatarUrl={message.sender.avatarUrl}
              firstName={message.sender.firstName}
              lastName={message.sender.lastName}
              size="sm"
            />
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isMine ? "items-end" : "items-start"
        )}
      >
        {/* Sender name (top of group, for other users) */}
        {!isMine && isFirstInGroup && (
          <span className="text-xs text-slate-500 mb-1 px-1">
            {message.sender.firstName} {message.sender.lastName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-3 py-2 text-sm leading-relaxed",
            isMine
              ? "bg-blue-600 text-white rounded-[18px] rounded-br-[4px]"
              : "bg-slate-100 text-slate-900 rounded-[18px] rounded-bl-[4px]",
            isFirstInGroup && !isLastInGroup && isMine && "rounded-br-[18px]",
            !isFirstInGroup && isLastInGroup && isMine && "rounded-tr-[18px] rounded-br-[4px]",
            !isFirstInGroup && !isLastInGroup && isMine && "rounded-r-[18px]",
            isFirstInGroup && !isLastInGroup && !isMine && "rounded-bl-[18px]",
            !isFirstInGroup && isLastInGroup && !isMine && "rounded-tl-[18px] rounded-bl-[4px]",
            !isFirstInGroup && !isLastInGroup && !isMine && "rounded-l-[18px]"
          )}
        >
          {isDeleted ? (
            <em className="opacity-60">Message deleted</em>
          ) : (
            message.content
          )}
        </div>

        {/* Time + Read receipt (only for last message in group) */}
        {isLastInGroup && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1 px-1",
              isMine ? "flex-row-reverse" : "flex-row"
            )}
          >
            <span className="text-[10px] text-slate-400">{timeStr}</span>
            {isMine && (
              <span className="text-[10px] text-slate-400">
                {readByOthers ? (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

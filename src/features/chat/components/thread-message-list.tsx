"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { DirectMessage } from "@/hooks/use-direct-messages";
import { MessageBubble } from "./message-bubble";

interface ThreadMessageListProps {
  messages: DirectMessage[];
  currentUserId: string;
  isLoading?: boolean;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(date: Date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function ThreadMessageList({
  messages,
  currentUserId,
  isLoading,
}: ThreadMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-slate-500">No messages yet. Say hello!</p>
      </div>
    );
  }

  // Messages come in desc order from API — reverse for display
  const sorted = [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );

  const items: React.ReactNode[] = [];
  let lastDayLabel = "";

  sorted.forEach((msg, idx) => {
    const prev = sorted[idx - 1];
    const next = sorted[idx + 1];
    const msgDate = new Date(msg.sentAt);
    const dayLabel = formatDayLabel(msgDate);

    // Day separator
    if (dayLabel !== lastDayLabel) {
      items.push(
        <div key={`day-${msg.id}`} className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">{dayLabel}</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      );
      lastDayLabel = dayLabel;
    }

    const isFirstInGroup =
      !prev ||
      prev.senderId !== msg.senderId ||
      new Date(msg.sentAt).getTime() - new Date(prev.sentAt).getTime() > 5 * 60 * 1000;

    const isLastInGroup =
      !next ||
      next.senderId !== msg.senderId ||
      new Date(next.sentAt).getTime() - new Date(msg.sentAt).getTime() > 5 * 60 * 1000;

    items.push(
      <MessageBubble
        key={msg.id}
        message={msg}
        currentUserId={currentUserId}
        showAvatar={true}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
      />
    );
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 px-4 py-4">
      {items}
      <div ref={bottomRef} />
    </div>
  );
}

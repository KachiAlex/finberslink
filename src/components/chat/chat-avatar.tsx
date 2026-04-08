"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChatAvatarProps {
  initialUnreadCount?: number;
}

export function ChatAvatar({ initialUnreadCount = 0 }: ChatAvatarProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="relative h-9 w-9 rounded-full p-0 hover:bg-slate-100"
    >
      <Link href="/dashboard/chat" className="flex items-center justify-center">
        <MessageCircle className="h-5 w-5 text-slate-600" />
        {initialUnreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 hover:bg-red-600"
          >
            {initialUnreadCount > 99 ? "99+" : initialUnreadCount}
          </Badge>
        )}
        <span className="sr-only">Chat {initialUnreadCount > 0 ? `(${initialUnreadCount} unread)` : ""}</span>
      </Link>
    </Button>
  );
}

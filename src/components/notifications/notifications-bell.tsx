"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationsBellProps {
  unreadCount: number;
}

export function NotificationsBell({ unreadCount }: NotificationsBellProps) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/notifications" className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

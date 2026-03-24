"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseChat {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  unreadCount?: number;
  type: "general" | "lesson" | "announcement";
  lastMessage?: string;
  participantCount?: number;
}

interface CourseChatsListProps {
  chats: CourseChat[];
  selectedChatId?: string;
  onSelectChat: (chat: CourseChat) => void;
}

export function CourseChatsList({
  chats,
  selectedChatId,
  onSelectChat,
}: CourseChatsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group chats by course
  const groupedChats = filteredChats.reduce(
    (acc, chat) => {
      const courseId = chat.courseId;
      if (!acc[courseId]) {
        acc[courseId] = {
          courseTitle: chat.courseTitle,
          courseSlug: chat.courseSlug,
          chats: [],
        };
      }
      acc[courseId].chats.push(chat);
      return acc;
    },
    {} as Record<
      string,
      { courseTitle: string; courseSlug: string; chats: CourseChat[] }
    >
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <h2 className="font-semibold text-slate-900">Course Chats</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedChats).length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No course chats yet
          </div>
        ) : (
          <div className="space-y-4 p-3">
            {Object.entries(groupedChats).map(
              ([courseId, { courseTitle, chats }]) => (
                <div key={courseId} className="space-y-2">
                  <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {courseTitle}
                  </h3>
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-slate-100 ${
                          selectedChatId === chat.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">
                              {chat.type === "general" ? "# General" : 
                               chat.type === "lesson" ? "📚 Lessons" :
                               "📢 Announcements"}
                            </div>
                            {chat.lastMessage && (
                              <p className="text-xs text-slate-500 truncate">
                                {chat.lastMessage}
                              </p>
                            )}
                          </div>
                          {chat.unreadCount ? (
                            <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
                              {chat.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
